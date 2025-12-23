import { Agent } from './agent';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { AgentConfig } from '~/types';
import { AGENT_CONFIG_SCHEMA } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentFactory');

export interface AgentFactoryDependencies {
  env?: Record<string, string>;
}

export class AgentFactory {
  private static _instance: AgentFactory | null = null;
  private _dependencies: AgentFactoryDependencies;

  private constructor(dependencies: AgentFactoryDependencies = {}) {
    this._dependencies = dependencies;
  }

  static getInstance(dependencies?: AgentFactoryDependencies): AgentFactory {
    if (!AgentFactory._instance) {
      AgentFactory._instance = new AgentFactory(dependencies);
    }

    return AgentFactory._instance;
  }

  async create(config: Partial<AgentConfig> = {}): Promise<Agent> {
    const validatedConfig = AGENT_CONFIG_SCHEMA.parse(config);

    logger.info(`Creating agent with config:`, validatedConfig);

    const agent = new Agent(validatedConfig);

    const llmManager = LLMManager.getInstance(this._dependencies.env || {});

    const { PlanExecuteReasoning } = await import('../reasoning/plan-execute');
    const { ToolExecutor } = await import('../tools/executor');

    const reasoningPattern = new PlanExecuteReasoning(llmManager, validatedConfig);
    const toolExecutorInstance = new ToolExecutor();

    let streamManager;
    let contextManager;
    let checkpointManager;
    let errorHandler;

    if (validatedConfig.enableMemory) {
      const { ContextManager } = await import('../memory/context-manager');
      contextManager = new ContextManager(validatedConfig.tokenBudget);
    }

    if (validatedConfig.enableCheckpointing) {
      const { CheckpointManager } = await import('../memory/checkpoint-manager');
      checkpointManager = new CheckpointManager();
      await checkpointManager.initialize();
    }

    if (validatedConfig.enableSelfCorrection) {
      const { ErrorHandler } = await import('../error-handling/error-handler');
      errorHandler = new ErrorHandler(llmManager);
    }

    agent.initialize({
      llmManager,
      reasoningPattern,
      toolExecutor: toolExecutorInstance,
      streamManager,
      contextManager,
      checkpointManager,
      errorHandler,
    });

    logger.info(`Agent created successfully with ID: ${agent.getId()}`);

    return agent;
  }

  async createDefault(): Promise<Agent> {
    return this.create({
      name: 'default-agent',
      model: 'claude-sonnet-4.5',
      reasoningPattern: 'plan-execute',
      maxIterations: 20,
      tokenBudget: 200000,
      enableSelfCorrection: true,
      enableMemory: true,
      enableCheckpointing: true,
    });
  }

  static async quickCreate(config?: Partial<AgentConfig>, env?: Record<string, string>): Promise<Agent> {
    const factory = AgentFactory.getInstance({ env });
    return factory.create(config);
  }
}

export const createAgent = AgentFactory.quickCreate;
