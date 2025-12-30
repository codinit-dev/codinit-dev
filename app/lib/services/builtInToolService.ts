import type { WebContainer } from '@webcontainer/api';
import { ToolRegistry } from '~/lib/common/tool-registry';
import { createScopedLogger } from '~/utils/logger';
import { readFile, lsRepo, grepRepo } from './tools/repoTools';
import { searchWeb, fetchFromWeb } from './tools/webTools';
import { manageTodo } from './tools/todoTools';

const logger = createScopedLogger('BuiltInToolService');

export interface ToolExecutor {
  (args: any, webcontainer?: WebContainer): Promise<any>;
}

export class BuiltInToolService {
  private static _instance: BuiltInToolService;
  private _enabledTools: Set<string> = new Set();
  private _webcontainer?: WebContainer;

  static getInstance(): BuiltInToolService {
    if (!BuiltInToolService._instance) {
      BuiltInToolService._instance = new BuiltInToolService();
    }

    return BuiltInToolService._instance;
  }

  constructor() {
    ToolRegistry.initialize();
    this.setEnabledTools(['ReadFile', 'LSRepo', 'SearchWeb', 'TodoManager']);
    logger.info('BuiltInToolService initialized');
  }

  setWebContainer(webcontainer: WebContainer): void {
    this._webcontainer = webcontainer;
    logger.info('WebContainer attached to BuiltInToolService');
  }

  setEnabledTools(toolNames: string[]): void {
    this._enabledTools = new Set(toolNames);
    logger.info('Enabled tools:', Array.from(this._enabledTools));
  }

  getEnabledTools(): string[] {
    return Array.from(this._enabledTools);
  }

  get tools(): Record<string, any> {
    const tools: Record<string, any> = {};
    const allTools = ToolRegistry.getAllToolDefinitions();

    for (const toolDef of allTools) {
      if (!this._enabledTools.has(toolDef.name)) {
        continue;
      }

      tools[toolDef.name] = {
        description: toolDef.description,
        parameters: toolDef.parameters,
        execute: this._getExecutor(toolDef.name),
      };
    }

    return tools;
  }

  get toolsWithoutExecute(): Record<string, any> {
    const tools: Record<string, any> = {};
    const allTools = ToolRegistry.getAllToolDefinitions();

    for (const toolDef of allTools) {
      if (!this._enabledTools.has(toolDef.name)) {
        continue;
      }

      tools[toolDef.name] = {
        description: toolDef.description,
        parameters: toolDef.parameters,
      };
    }

    return tools;
  }

  private _getExecutor(toolName: string): ToolExecutor {
    const executorMap: Record<string, ToolExecutor> = {
      ReadFile: this._executeReadFile.bind(this),
      LSRepo: this._executeLSRepo.bind(this),
      GrepRepo: this._executeGrepRepo.bind(this),
      SearchWeb: this._executeSearchWeb.bind(this),
      FetchFromWeb: this._executeFetchFromWeb.bind(this),
      TodoManager: this._executeTodoManager.bind(this),
    };

    const executor = executorMap[toolName];

    if (!executor) {
      throw new Error(`No executor found for tool: ${toolName}`);
    }

    return executor;
  }

  private async _executeReadFile(args: any): Promise<any> {
    if (!this._webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    logger.info('Executing ReadFile tool');

    return await readFile(this._webcontainer, args);
  }

  private async _executeLSRepo(args: any): Promise<any> {
    if (!this._webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    logger.info('Executing LSRepo tool');

    return await lsRepo(this._webcontainer, args);
  }

  private async _executeGrepRepo(args: any): Promise<any> {
    if (!this._webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    logger.info('Executing GrepRepo tool');

    return await grepRepo(this._webcontainer, args);
  }

  private async _executeSearchWeb(args: any): Promise<any> {
    logger.info('Executing SearchWeb tool');
    return await searchWeb(args);
  }

  private async _executeFetchFromWeb(args: any): Promise<any> {
    logger.info('Executing FetchFromWeb tool');
    return await fetchFromWeb(args);
  }

  private async _executeTodoManager(args: any): Promise<any> {
    logger.info('Executing TodoManager tool');
    return manageTodo(args);
  }

  async executeTool(toolName: string, args: any): Promise<any> {
    if (!this._enabledTools.has(toolName)) {
      throw new Error(`Tool ${toolName} is not enabled`);
    }

    const executor = this._getExecutor(toolName);

    return await executor(args, this._webcontainer);
  }

  async processToolInvocations(messages: any[], dataStream: any): Promise<any[]> {
    const processedMessages = [...messages];

    for (const message of processedMessages) {
      if (message.role === 'assistant' && message.toolInvocations) {
        for (const invocation of message.toolInvocations) {
          if (invocation.state === 'call' && this._enabledTools.has(invocation.toolName)) {
            try {
              logger.info('Processing tool invocation:', invocation.toolName);

              const result = await this.executeTool(invocation.toolName, invocation.args);

              invocation.state = 'result';
              invocation.result = result;

              if (dataStream) {
                dataStream.writeData({
                  type: 'tool-result',
                  toolName: invocation.toolName,
                  result,
                });
              }
            } catch (error) {
              logger.error('Tool execution error:', error);

              invocation.state = 'result';
              invocation.result = {
                error: error instanceof Error ? error.message : 'Unknown error',
              };

              if (dataStream) {
                dataStream.writeData({
                  type: 'tool-error',
                  toolName: invocation.toolName,
                  error: error instanceof Error ? error.message : 'Unknown error',
                });
              }
            }
          }
        }
      }
    }

    return processedMessages;
  }
}
