import {
  experimental_createMCPClient,
  type ToolSet,
  type Message,
  type DataStreamWriter,
  convertToCoreMessages,
  formatDataStreamPart,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';
import type { ToolCallAnnotation } from '~/types/context';
import {
  TOOL_EXECUTION_APPROVAL,
  TOOL_EXECUTION_DENIED,
  TOOL_EXECUTION_ERROR,
  TOOL_NO_EXECUTE_FUNCTION,
} from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('mcp-service');

export const stdioServerConfigSchema = z
  .object({
    type: z.enum(['stdio']).optional(),
    command: z.string().min(1, 'Command cannot be empty'),
    args: z.array(z.string()).optional(),
    cwd: z.string().optional(),
    env: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    type: 'stdio' as const,
  }));
export type STDIOServerConfig = z.infer<typeof stdioServerConfigSchema>;

export const sseServerConfigSchema = z
  .object({
    type: z.enum(['sse']).optional(),
    url: z.string().url('URL must be a valid URL format'),
    headers: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    type: 'sse' as const,
  }));
export type SSEServerConfig = z.infer<typeof sseServerConfigSchema>;

export const streamableHTTPServerConfigSchema = z
  .object({
    type: z.enum(['streamable-http']).optional(),
    url: z.string().url('URL must be a valid URL format'),
    headers: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    type: 'streamable-http' as const,
  }));

export type StreamableHTTPServerConfig = z.infer<typeof streamableHTTPServerConfigSchema>;

export const mcpServerConfigSchema = z.union([
  stdioServerConfigSchema,
  sseServerConfigSchema,
  streamableHTTPServerConfigSchema,
]);
export type MCPServerConfig = z.infer<typeof mcpServerConfigSchema>;

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerConfigSchema),
});
export type MCPConfig = z.infer<typeof mcpConfigSchema>;

export type MCPClient = {
  tools: () => Promise<ToolSet>;
  close: () => Promise<void>;
} & {
  serverName: string;
};

export type ToolCall = {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type MCPServerTools = Record<string, MCPServer>;

export type MCPServerAvailable = {
  status: 'available';
  tools: ToolSet;
  client: MCPClient;
  config: MCPServerConfig;
};
export type MCPServerUnavailable = {
  status: 'unavailable';
  error: string;
  client: MCPClient | null;
  config: MCPServerConfig;
};
export type MCPServer = MCPServerAvailable | MCPServerUnavailable | MCPServerConnecting;

export type MCPServerConnecting = {
  status: 'connecting';
  config: MCPServerConfig;
  retryCount: number;
  lastAttempt: Date;
};

interface LogThrottleEntry {
  lastLogged: number;
}

export class MCPService {
  private static _instance: MCPService;
  private _tools: ToolSet = {};
  private _toolsWithoutExecute: ToolSet = {};
  private _mcpToolsPerServer: MCPServerTools = {};
  private _toolNamesToServerNames = new Map<string, string>();
  private _config: MCPConfig = {
    mcpServers: {},
  };
  private _availabilityCheckThrottleCache: Map<string, LogThrottleEntry> = new Map();
  private readonly _logThrottleMs = 5 * 60 * 1000; // 5 minutes
  private _retryAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly _maxRetryAttempts = 3;
  private readonly _retryDelayMs = 5000; // 5 seconds

  static getInstance(): MCPService {
    if (!MCPService._instance) {
      MCPService._instance = new MCPService();
    }

    return MCPService._instance;
  }

  private _shouldThrottleAvailabilityLog(serverName: string): boolean {
    const now = Date.now();
    const cached = this._availabilityCheckThrottleCache.get(serverName);

    if (cached && now - cached.lastLogged < this._logThrottleMs) {
      return true; // Throttle this log
    }

    this._availabilityCheckThrottleCache.set(serverName, { lastLogged: now });

    return false; // Log this message
  }

  private _shouldRetryConnection(serverName: string): boolean {
    const retryInfo = this._retryAttempts.get(serverName);

    if (!retryInfo) {
      return true; // First attempt
    }

    const now = Date.now();
    const timeSinceLastAttempt = now - retryInfo.lastAttempt.getTime();

    // Exponential backoff: 5s, 10s, 20s
    const backoffDelay = this._retryDelayMs * Math.pow(2, retryInfo.count);

    return retryInfo.count < this._maxRetryAttempts && timeSinceLastAttempt >= backoffDelay;
  }

  private _recordRetryAttempt(serverName: string, success: boolean): void {
    if (success) {
      this._retryAttempts.delete(serverName);
    } else {
      const current = this._retryAttempts.get(serverName) || { count: 0, lastAttempt: new Date() };
      this._retryAttempts.set(serverName, {
        count: current.count + 1,
        lastAttempt: new Date(),
      });
    }
  }

  validateServerConfig(
    serverName: string,
    config: any,
  ): { isValid: boolean; error?: string; config?: MCPServerConfig } {
    try {
      const validatedConfig = mcpServerConfigSchema.parse(config);
      return { isValid: true, config: validatedConfig };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        return { isValid: false, error: `Invalid configuration for server "${serverName}": ${errorMessages}` };
      }

      return {
        isValid: false,
        error: `Configuration validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
      };
    }
  }

  private _validateServerConfig(serverName: string, config: any): MCPServerConfig {
    const hasStdioField = config.command !== undefined;
    const hasUrlField = config.url !== undefined;

    if (hasStdioField && hasUrlField) {
      throw new Error(`cannot have "command" and "url" defined for the same server.`);
    }

    if (!config.type && hasStdioField) {
      config.type = 'stdio';
    }

    if (hasUrlField && !config.type) {
      throw new Error(`missing "type" field, only "sse" and "streamable-http" are valid options.`);
    }

    if (!['stdio', 'sse', 'streamable-http'].includes(config.type)) {
      throw new Error(`provided "type" is invalid, only "stdio", "sse" or "streamable-http" are valid options.`);
    }

    // Check for type/field mismatch
    if (config.type === 'stdio' && !hasStdioField) {
      throw new Error(`missing "command" field.`);
    }

    if (['sse', 'streamable-http'].includes(config.type) && !hasUrlField) {
      throw new Error(`missing "url" field.`);
    }

    try {
      return mcpServerConfigSchema.parse(config);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        throw new Error(`Invalid configuration for server "${serverName}": ${errorMessages}`);
      }

      throw validationError;
    }
  }

  async updateConfig(config: MCPConfig) {
    logger.debug('updating config', JSON.stringify(config));
    this._config = config;
    await this._createClients();

    return this._mcpToolsPerServer;
  }

  private async _createStreamableHTTPClient(
    serverName: string,
    config: StreamableHTTPServerConfig,
  ): Promise<MCPClient> {
    logger.debug(`Creating Streamable-HTTP client for ${serverName} with URL: ${config.url}`);

    const client = await experimental_createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL(config.url), {
        requestInit: {
          headers: config.headers,
        },
      }),
    });

    return Object.assign(client, { serverName });
  }

  private async _createSSEClient(serverName: string, config: SSEServerConfig): Promise<MCPClient> {
    logger.debug(`Creating SSE client for ${serverName} with URL: ${config.url}`);

    const client = await experimental_createMCPClient({
      transport: config,
    });

    return Object.assign(client, { serverName });
  }

  private async _createStdioClient(serverName: string, config: STDIOServerConfig): Promise<MCPClient> {
    logger.debug(
      `Creating STDIO client for '${serverName}' with command: '${config.command}' ${config.args?.join(' ') || ''}`,
    );

    const client = await experimental_createMCPClient({ transport: new Experimental_StdioMCPTransport(config) });

    return Object.assign(client, { serverName });
  }

  private _registerTools(serverName: string, tools: ToolSet) {
    for (const [toolName, tool] of Object.entries(tools)) {
      if (this._tools[toolName]) {
        const existingServerName = this._toolNamesToServerNames.get(toolName);

        if (existingServerName && existingServerName !== serverName) {
          logger.warn(`Tool conflict: "${toolName}" from "${serverName}" overrides tool from "${existingServerName}"`);
        }
      }

      this._tools[toolName] = tool;
      this._toolsWithoutExecute[toolName] = { ...tool, execute: undefined };
      this._toolNamesToServerNames.set(toolName, serverName);
    }
  }

  private async _createMCPClient(serverName: string, serverConfig: MCPServerConfig): Promise<MCPClient> {
    const validatedConfig = this._validateServerConfig(serverName, serverConfig);

    if (validatedConfig.type === 'stdio') {
      return await this._createStdioClient(serverName, serverConfig as STDIOServerConfig);
    } else if (validatedConfig.type === 'sse') {
      return await this._createSSEClient(serverName, serverConfig as SSEServerConfig);
    } else {
      return await this._createStreamableHTTPClient(serverName, serverConfig as StreamableHTTPServerConfig);
    }
  }

  private async _createClients() {
    await this._closeClients();

    const createClientPromises = Object.entries(this._config?.mcpServers || []).map(async ([serverName, config]) => {
      let client: MCPClient | null = null;

      try {
        client = await this._createMCPClient(serverName, config);

        try {
          const tools = await client.tools();

          this._registerTools(serverName, tools);

          this._mcpToolsPerServer[serverName] = {
            status: 'available',
            client,
            tools,
            config,
          };
        } catch (error) {
          logger.error(`Failed to get tools from server ${serverName}:`, error);
          this._mcpToolsPerServer[serverName] = {
            status: 'unavailable',
            error: 'could not retrieve tools from server',
            client,
            config,
          };
        }
      } catch (error) {
        logger.error(`Failed to initialize MCP client for server: ${serverName}`, error);
        this._mcpToolsPerServer[serverName] = {
          status: 'unavailable',
          error: (error as Error).message,
          client,
          config,
        };
      }
    });

    await Promise.allSettled(createClientPromises);
  }

  async checkServersAvailabilities() {
    this._tools = {};
    this._toolsWithoutExecute = {};
    this._toolNamesToServerNames.clear();

    const checkPromises = Object.entries(this._mcpToolsPerServer).map(async ([serverName, server]) => {
      // Skip servers that are currently connecting
      if (server.status === 'connecting') {
        return;
      }

      // Check if we should retry this connection
      if (server.status === 'unavailable' && !this._shouldRetryConnection(serverName)) {
        return; // Skip retry, not enough time has passed
      }

      // Mark as connecting
      this._mcpToolsPerServer[serverName] = {
        status: 'connecting',
        config: server.config,
        retryCount: this._retryAttempts.get(serverName)?.count || 0,
        lastAttempt: new Date(),
      };

      let client = server.client;

      try {
        if (!this._shouldThrottleAvailabilityLog(serverName)) {
          logger.debug(`Checking MCP server "${serverName}" availability: start`);
        }

        if (!client) {
          client = await this._createMCPClient(serverName, this._config?.mcpServers[serverName]);
        }

        try {
          const tools = await client.tools();

          this._registerTools(serverName, tools);

          this._mcpToolsPerServer[serverName] = {
            status: 'available',
            client,
            tools,
            config: server.config,
          };

          this._recordRetryAttempt(serverName, true); // Success
        } catch (error) {
          logger.error(`Failed to get tools from server ${serverName}:`, error);

          const errorMessage = this._formatConnectionError(error, serverName);
          this._mcpToolsPerServer[serverName] = {
            status: 'unavailable',
            error: errorMessage,
            client,
            config: server.config,
          };

          this._recordRetryAttempt(serverName, false); // Failed
        }

        if (!this._shouldThrottleAvailabilityLog(serverName)) {
          logger.debug(`Checking MCP server "${serverName}" availability: end`);
        }
      } catch (error) {
        logger.error(`Failed to connect to server ${serverName}:`, error);

        const errorMessage = this._formatConnectionError(error, serverName);
        this._mcpToolsPerServer[serverName] = {
          status: 'unavailable',
          error: errorMessage,
          client,
          config: server.config,
        };

        this._recordRetryAttempt(serverName, false); // Failed
      }
    });

    await Promise.allSettled(checkPromises);

    return this._mcpToolsPerServer;
  }

  private _formatConnectionError(error: any, serverName: string): string {
    const config = this._config?.mcpServers[serverName];

    if (!config) {
      return 'Server configuration not found';
    }

    // Handle specific error types with user-friendly messages
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('econnrefused') || message.includes('fetch failed') || message.includes('failed to fetch')) {
        return config.type === 'stdio'
          ? `Cannot start MCP server. Check that the command is correct and the server is installed.`
          : `Cannot connect to MCP server. Check that the URL is correct and the server is running.`;
      }

      if (message.includes('enotfound') || message.includes('name resolution failure')) {
        return `Cannot resolve hostname. Check the URL and network connection.`;
      }

      if (message.includes('timeout') || message.includes('etimedout')) {
        return `Connection timed out. The MCP server may be slow or unreachable.`;
      }

      if (message.includes('401') || message.includes('unauthorized')) {
        return `Authentication failed. Check your API keys or credentials.`;
      }

      if (message.includes('403') || message.includes('forbidden')) {
        return `Access denied. Check your permissions and authentication.`;
      }

      if (message.includes('404') || message.includes('not found')) {
        return config.type === 'stdio'
          ? `MCP server command not found. Install the server or check the command path.`
          : `MCP server endpoint not found. Check the URL and server configuration.`;
      }

      if (message.includes('command not found') && config.type === 'stdio') {
        return `Command "${(config as any).command}" not found. Install the MCP server or check your PATH.`;
      }

      if (message.includes('permission denied') || message.includes('eacces')) {
        return config.type === 'stdio'
          ? `Permission denied. Check file permissions for "${(config as any).command}".`
          : `Permission denied. Check your authentication credentials.`;
      }

      if (message.includes('certificate') || message.includes('ssl') || message.includes('tls')) {
        return `SSL/TLS certificate error. Check your certificate configuration.`;
      }

      if (message.includes('invalid configuration')) {
        return `Invalid server configuration. Check your settings and try again.`;
      }
    }

    // Generic error message with fallback
    return error instanceof Error ? error.message : 'Unknown connection error occurred';
  }

  private async _closeClients(): Promise<void> {
    const closePromises = Object.entries(this._mcpToolsPerServer).map(async ([serverName, server]) => {
      if (server.status === 'connecting' || !server.client) {
        return;
      }

      logger.debug(`Closing client for server "${serverName}"`);

      try {
        await server.client.close();
      } catch (error) {
        logger.error(`Error closing client for ${serverName}:`, error);
      }
    });

    await Promise.allSettled(closePromises);
    this._tools = {};
    this._toolsWithoutExecute = {};
    this._mcpToolsPerServer = {};
    this._toolNamesToServerNames.clear();
  }

  isValidToolName(toolName: string): boolean {
    return toolName in this._tools;
  }

  processToolCall(toolCall: ToolCall, dataStream: DataStreamWriter): void {
    const { toolCallId, toolName } = toolCall;

    if (this.isValidToolName(toolName)) {
      const { description = 'No description available' } = this.toolsWithoutExecute[toolName];
      const serverName = this._toolNamesToServerNames.get(toolName);

      if (serverName) {
        dataStream.writeMessageAnnotation({
          type: 'toolCall',
          toolCallId,
          serverName,
          toolName,
          toolDescription: description,
        } satisfies ToolCallAnnotation);
      }
    }
  }

  async processToolInvocations(messages: Message[], dataStream: DataStreamWriter): Promise<Message[]> {
    const lastMessage = messages[messages.length - 1];
    const parts = lastMessage.parts;

    if (!parts) {
      return messages;
    }

    const processedParts = await Promise.all(
      parts.map(async (part) => {
        // Only process tool invocations parts
        if (part.type !== 'tool-invocation') {
          return part;
        }

        const { toolInvocation } = part;
        const { toolName, toolCallId } = toolInvocation;

        // return part as-is if tool does not exist, or if it's not a tool call result
        if (!this.isValidToolName(toolName) || toolInvocation.state !== 'result') {
          return part;
        }

        let result;

        if (toolInvocation.result === TOOL_EXECUTION_APPROVAL.APPROVE) {
          const toolInstance = this._tools[toolName];

          if (toolInstance && typeof toolInstance.execute === 'function') {
            logger.debug(`calling tool "${toolName}" with args: ${JSON.stringify(toolInvocation.args)}`);

            try {
              result = await toolInstance.execute(toolInvocation.args, {
                messages: convertToCoreMessages(messages),
                toolCallId,
              });
            } catch (error) {
              logger.error(`error while calling tool "${toolName}":`, error);
              result = TOOL_EXECUTION_ERROR;
            }
          } else {
            result = TOOL_NO_EXECUTE_FUNCTION;
          }
        } else if (toolInvocation.result === TOOL_EXECUTION_APPROVAL.REJECT) {
          result = TOOL_EXECUTION_DENIED;
        } else {
          // For any unhandled responses, return the original part.
          return part;
        }

        // Forward updated tool result to the client.
        dataStream.write(
          formatDataStreamPart('tool_result', {
            toolCallId,
            result,
          }),
        );

        // Return updated toolInvocation with the actual result.
        return {
          ...part,
          toolInvocation: {
            ...toolInvocation,
            result,
          },
        };
      }),
    );

    // Finally return the processed messages
    return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
  }

  get tools() {
    return this._tools;
  }

  getToolsForServer(serverName: string | null) {
    if (!serverName) {
      return this._tools;
    }

    const filteredTools: ToolSet = {};

    for (const [toolName, tool] of Object.entries(this._tools)) {
      if (this._toolNamesToServerNames.get(toolName) === serverName) {
        filteredTools[toolName] = tool;
      }
    }

    return filteredTools;
  }

  get toolsWithoutExecute() {
    return this._toolsWithoutExecute;
  }
}
