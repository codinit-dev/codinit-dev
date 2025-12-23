import type { AgentTool, ToolContext, ToolExecutorOptions, ToolRegistry } from './types';
import type { ToolResult } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ToolExecutor');

export class ToolExecutor {
  private _tools: ToolRegistry = new Map();
  private _options: ToolExecutorOptions;

  constructor(options: ToolExecutorOptions = {}) {
    this._options = {
      defaultTimeout: options.defaultTimeout || 30000,
      maxConcurrent: options.maxConcurrent || 5,
    };
  }

  registerTool(tool: AgentTool): void {
    if (this._tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} is already registered. Overwriting.`);
    }

    this._tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name}`);
  }

  registerTools(tools: AgentTool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  unregisterTool(name: string): boolean {
    const result = this._tools.delete(name);

    if (result) {
      logger.debug(`Unregistered tool: ${name}`);
    }

    return result;
  }

  hasTool(name: string): boolean {
    return this._tools.has(name);
  }

  getTool(name: string): AgentTool | undefined {
    return this._tools.get(name);
  }

  getAvailableTools(): string[] {
    return Array.from(this._tools.keys());
  }

  getAllTools(): AgentTool[] {
    return Array.from(this._tools.values());
  }

  async executeTool(name: string, args: any, context: ToolContext): Promise<ToolResult> {
    const tool = this._tools.get(name);

    if (!tool) {
      logger.error(`Tool not found: ${name}`);
      return {
        toolCallId: `${name}-${Date.now()}`,
        success: false,
        output: null,
        error: `Tool '${name}' not found. Available tools: ${this.getAvailableTools().join(', ')}`,
      };
    }

    logger.info(`Executing tool: ${name}`);

    const startTime = Date.now();

    try {
      const validatedArgs = tool.parameters.parse(args);

      if (tool.validate && !tool.validate(validatedArgs)) {
        return {
          toolCallId: `${name}-${Date.now()}`,
          success: false,
          output: null,
          error: `Tool validation failed for: ${name}`,
        };
      }

      const timeout = tool.timeout || this._options.defaultTimeout;
      const result = await this._executeWithTimeout(() => tool.execute(validatedArgs, context), timeout!, name);

      const duration = Date.now() - startTime;
      logger.info(`Tool ${name} executed successfully in ${duration}ms`);

      return {
        ...result,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`Tool ${name} execution failed:`, error);

      return {
        toolCallId: `${name}-${Date.now()}`,
        success: false,
        output: null,
        error: error.message || 'Unknown error during tool execution',
        duration,
      };
    }
  }

  async executeTools(calls: Array<{ name: string; args: any }>, context: ToolContext): Promise<ToolResult[]> {
    logger.info(`Executing ${calls.length} tools`);

    const results = await Promise.allSettled(calls.map((call) => this.executeTool(call.name, call.args, context)));

    return results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`Tool ${calls[idx].name} failed:`, result.reason);
        return {
          toolCallId: `${calls[idx].name}-${Date.now()}`,
          success: false,
          output: null,
          error: result.reason?.message || 'Tool execution rejected',
        };
      }
    });
  }

  private async _executeWithTimeout<T>(fn: () => Promise<T>, timeout: number, toolName: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool '${toolName}' execution timeout after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  clearAllTools(): void {
    this._tools.clear();
    logger.info('All tools cleared');
  }

  getToolsMetadata(): Array<{ name: string; description: string; parameters: any }> {
    return this.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }
}
