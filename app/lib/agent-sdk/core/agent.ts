import { generateId } from 'ai';
import type { LLMManager } from '~/lib/modules/llm/manager';
import type { ReasoningPattern } from '~/lib/agent-sdk/reasoning/base';
import type { ToolExecutor } from '~/lib/agent-sdk/tools/executor';
import type { StreamManager } from '~/lib/agent-sdk/streaming/stream-manager';
import type { ContextManager } from '~/lib/agent-sdk/memory/context-manager';
import type { CheckpointManager } from '~/lib/agent-sdk/memory/checkpoint-manager';
import type { ErrorHandler } from '~/lib/agent-sdk/error-handling/error-handler';
import type {
  AgentConfig,
  AgentState,
  AgentResult,
  AgentContext,
  Plan,
  PlanStep,
  ToolCall,
  Observation,
  Reflection,
  AgentStatus,
} from '~/types';
import { AGENT_CONFIG_SCHEMA, AGENT_STATE_SCHEMA } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Agent');

type AgentEventCallback<T = any> = (data: T) => void | Promise<void>;

export class Agent {
  private _config: AgentConfig;
  private _state: AgentState;
  private _id: string;

  private _llmManager?: LLMManager;
  private _reasoningPattern?: ReasoningPattern;
  private _toolExecutor?: ToolExecutor;
  private _streamManager?: StreamManager;
  private _contextManager?: ContextManager;
  private _checkpointManager?: CheckpointManager;
  private _errorHandler?: ErrorHandler;

  private _callbacks: {
    onPlanGenerated: AgentEventCallback<Plan>[];
    onStepStarted: AgentEventCallback<PlanStep>[];
    onToolCall: AgentEventCallback<ToolCall>[];
    onObservation: AgentEventCallback<Observation>[];
    onReflection: AgentEventCallback<Reflection>[];
    onStatusChange: AgentEventCallback<AgentStatus>[];
  };

  constructor(config: Partial<AgentConfig> = {}) {
    this._config = AGENT_CONFIG_SCHEMA.parse(config);
    this._id = generateId();

    this._state = AGENT_STATE_SCHEMA.parse({
      status: 'idle',
      currentIteration: 0,
      history: [],
      observations: [],
      reflections: [],
      tokensUsed: 0,
      startTime: Date.now(),
    });

    this._callbacks = {
      onPlanGenerated: [],
      onStepStarted: [],
      onToolCall: [],
      onObservation: [],
      onReflection: [],
      onStatusChange: [],
    };
  }

  initialize(dependencies: {
    llmManager: LLMManager;
    reasoningPattern: ReasoningPattern;
    toolExecutor: ToolExecutor;
    streamManager?: StreamManager;
    contextManager?: ContextManager;
    checkpointManager?: CheckpointManager;
    errorHandler?: ErrorHandler;
  }): void {
    this._llmManager = dependencies.llmManager;
    this._reasoningPattern = dependencies.reasoningPattern;
    this._toolExecutor = dependencies.toolExecutor;
    this._streamManager = dependencies.streamManager;
    this._contextManager = dependencies.contextManager;
    this._checkpointManager = dependencies.checkpointManager;
    this._errorHandler = dependencies.errorHandler;
  }

  async execute(task: string, context: AgentContext): Promise<AgentResult> {
    if (!this._reasoningPattern || !this._toolExecutor) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    logger.info(`Starting agent execution for task: ${task}`);
    this._updateStatus('planning');

    const startTime = Date.now();
    let currentIteration = 0;

    try {
      const plan = await this._generatePlan(task, context);
      this._state.plan = plan;
      await this._emitCallback('onPlanGenerated', plan);

      if (this._config.enableCheckpointing && this._checkpointManager) {
        await this._checkpointManager.saveCheckpoint({
          id: generateId(),
          threadId: this._id,
          agentId: this._id,
          state: this._state,
          timestamp: Date.now(),
        });
      }

      while (currentIteration < this._config.maxIterations && this._reasoningPattern.shouldContinue(this._state)) {
        this._state.currentIteration = currentIteration;
        this._updateStatus('executing');

        const stepResults = await this._executePlanSteps(plan, context);

        this._updateStatus('reflecting');

        const reflection = await this._reflect(stepResults, task, context);
        this._state.reflections.push(reflection);
        await this._emitCallback('onReflection', reflection);

        if (reflection.goalAchieved) {
          logger.info('Goal achieved, completing execution');
          break;
        }

        if (!reflection.shouldContinue) {
          logger.info('Reflection determined execution should stop');
          break;
        }

        currentIteration++;
      }

      this._updateStatus('complete');

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        success: true,
        output: this._generateOutput(),
        artifacts: this._collectArtifacts(),
        tokensUsed: this._state.tokensUsed,
        iterations: currentIteration,
        duration,
      };

      logger.info(`Agent execution completed successfully in ${duration}ms`);

      return result;
    } catch (error: any) {
      logger.error('Agent execution failed:', error);
      this._updateStatus('failed');

      const duration = Date.now() - startTime;

      return {
        success: false,
        output: '',
        artifacts: [],
        tokensUsed: this._state.tokensUsed,
        iterations: currentIteration,
        duration,
        error: error.message,
      };
    }
  }

  async *stream(task: string, context: AgentContext): AsyncGenerator<any> {
    if (!this._reasoningPattern || !this._toolExecutor) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    logger.info(`Starting agent streaming execution for task: ${task}`);
    this._updateStatus('planning');

    const startTime = Date.now();
    let currentIteration = 0;

    try {
      const plan = await this._generatePlan(task, context);
      this._state.plan = plan;
      yield { type: 'agent-plan', plan, timestamp: Date.now() };
      await this._emitCallback('onPlanGenerated', plan);

      while (currentIteration < this._config.maxIterations && this._reasoningPattern.shouldContinue(this._state)) {
        this._state.currentIteration = currentIteration;
        this._updateStatus('executing');

        for (const step of plan.steps) {
          yield { type: 'agent-step-start', step, timestamp: Date.now() };
          await this._emitCallback('onStepStarted', step);

          const result = await this._executeStep(step, context);

          for (const observation of result.observations) {
            yield { type: 'agent-observation', observation, timestamp: Date.now() };
          }
        }

        this._updateStatus('reflecting');

        const stepResults = plan.steps.map((_step: PlanStep, idx: number) => ({
          stepNumber: idx + 1,
          success: true,
          observations: [],
          artifacts: [],
        }));

        const reflection = await this._reflect(stepResults, task, context);
        this._state.reflections.push(reflection);
        yield { type: 'agent-reflection', reflection, timestamp: Date.now() };
        await this._emitCallback('onReflection', reflection);

        if (reflection.goalAchieved) {
          break;
        }

        if (!reflection.shouldContinue) {
          break;
        }

        currentIteration++;
      }

      this._updateStatus('complete');

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        success: true,
        output: this._generateOutput(),
        artifacts: this._collectArtifacts(),
        tokensUsed: this._state.tokensUsed,
        iterations: currentIteration,
        duration,
      };

      yield { type: 'agent-complete', result, timestamp: Date.now() };
    } catch (error: any) {
      logger.error('Agent streaming execution failed:', error);
      this._updateStatus('failed');

      yield {
        type: 'agent-error',
        error: error.message,
        recoverable: false,
        timestamp: Date.now(),
      };
    }
  }

  private async _generatePlan(task: string, _context: AgentContext): Promise<Plan> {
    if (!this._reasoningPattern) {
      throw new Error('Reasoning pattern not initialized');
    }

    const reasoningContext = {
      task,
      currentState: this._state,
      availableTools: this._toolExecutor?.getAvailableTools() || [],
      previousResults: [],
    };

    return await this._reasoningPattern.generatePlan(task, reasoningContext);
  }

  private async _executePlanSteps(plan: Plan, context: AgentContext): Promise<any[]> {
    const results = [];

    for (const step of plan.steps) {
      this._state.currentStep = step.number;
      await this._emitCallback('onStepStarted', step);

      const result = await this._executeStep(step, context);
      results.push(result);

      for (const observation of result.observations) {
        this._state.observations.push(observation);
        await this._emitCallback('onObservation', observation);
      }
    }

    return results;
  }

  private async _executeStep(step: PlanStep, _context: AgentContext): Promise<any> {
    if (!this._reasoningPattern) {
      throw new Error('Reasoning pattern not initialized');
    }

    const reasoningContext = {
      task: '',
      currentState: this._state,
      availableTools: this._toolExecutor?.getAvailableTools() || [],
      previousResults: [],
    };

    return await this._reasoningPattern.executeStep(step, reasoningContext);
  }

  private async _reflect(results: any[], task: string, _context: AgentContext): Promise<Reflection> {
    if (!this._reasoningPattern) {
      throw new Error('Reasoning pattern not initialized');
    }

    const reasoningContext = {
      task,
      currentState: this._state,
      availableTools: this._toolExecutor?.getAvailableTools() || [],
      previousResults: results,
    };

    return await this._reasoningPattern.reflect(results, task, reasoningContext);
  }

  private _updateStatus(status: AgentStatus): void {
    this._state.status = status;
    this._emitCallback('onStatusChange', status);
  }

  private _generateOutput(): string {
    return this._state.observations.map((obs: Observation) => obs.content).join('\n');
  }

  private _collectArtifacts(): string[] {
    const artifacts: string[] = [];

    for (const obs of this._state.observations) {
      if (obs.metadata?.artifacts) {
        artifacts.push(...obs.metadata.artifacts);
      }
    }

    return artifacts;
  }

  private async _emitCallback<K extends keyof typeof this._callbacks>(event: K, data: any): Promise<void> {
    const callbacks = this._callbacks[event];

    for (const callback of callbacks) {
      try {
        await callback(data);
      } catch (error) {
        logger.error(`Error in ${event} callback:`, error);
      }
    }
  }

  onPlanGenerated(callback: AgentEventCallback<Plan>): this {
    this._callbacks.onPlanGenerated.push(callback);
    return this;
  }

  onStepStarted(callback: AgentEventCallback<PlanStep>): this {
    this._callbacks.onStepStarted.push(callback);
    return this;
  }

  onToolCall(callback: AgentEventCallback<ToolCall>): this {
    this._callbacks.onToolCall.push(callback);
    return this;
  }

  onObservation(callback: AgentEventCallback<Observation>): this {
    this._callbacks.onObservation.push(callback);
    return this;
  }

  onReflection(callback: AgentEventCallback<Reflection>): this {
    this._callbacks.onReflection.push(callback);
    return this;
  }

  onStatusChange(callback: AgentEventCallback<AgentStatus>): this {
    this._callbacks.onStatusChange.push(callback);
    return this;
  }

  getState(): AgentState {
    return { ...this._state };
  }

  getConfig(): AgentConfig {
    return { ...this._config };
  }

  getId(): string {
    return this._id;
  }
}
