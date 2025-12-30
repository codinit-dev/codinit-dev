import { z } from 'zod';
import type { ToolSet } from 'ai';

export const stdioServerConfigSchema = z.object({
  type: z.literal('stdio').default('stdio'),
  command: z.string().min(1, 'Command cannot be empty'),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
});

export const sseServerConfigSchema = z.object({
  type: z.literal('sse').default('sse'),
  url: z.string().url('URL must be a valid URL format'),
  headers: z.record(z.string()).optional(),
});

export const streamableHTTPServerConfigSchema = z.object({
  type: z.literal('streamable-http').default('streamable-http'),
  url: z.string().url('URL must be a valid URL format'),
  headers: z.record(z.string()).optional(),
});

export const mcpServerConfigSchema = z
  .union([stdioServerConfigSchema, sseServerConfigSchema, streamableHTTPServerConfigSchema])
  .superRefine((data, ctx) => {
    const hasCommand = 'command' in data;
    const hasUrl = 'url' in data;

    if (hasCommand && hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot have both "command" and "url" defined for the same server.',
      });
    }

    if (hasUrl && !('url' in data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing "url" field for URL-based server.',
      });
    }
  });

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerConfigSchema),
});

export type STDIOServerConfig = z.infer<typeof stdioServerConfigSchema>;
export type SSEServerConfig = z.infer<typeof sseServerConfigSchema>;
export type StreamableHTTPServerConfig = z.infer<typeof streamableHTTPServerConfigSchema>;
export type MCPServerConfig = z.infer<typeof mcpServerConfigSchema>;
export type MCPConfig = z.infer<typeof mcpConfigSchema>;

export type ToolCall = {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type MCPClient = {
  tools: () => Promise<ToolSet>;
  close: () => Promise<void>;
  serverName: string;
};

// Server status types
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

export type MCPServerConnecting = {
  status: 'connecting';
  config: MCPServerConfig;
  retryCount: number;
  lastAttempt: Date;
};

export type MCPServer = MCPServerAvailable | MCPServerUnavailable | MCPServerConnecting;

export type MCPServerTools = Record<string, MCPServer>;

export type { ToolSet };
