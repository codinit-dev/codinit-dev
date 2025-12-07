import { z } from 'zod';
import type { ToolSet } from 'ai';

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

export const mcpServerConfigSchema = z.union([
  stdioServerConfigSchema,
  sseServerConfigSchema,
  streamableHTTPServerConfigSchema,
]);

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerConfigSchema),
});

export type MCPServerConfig = z.infer<typeof mcpServerConfigSchema>;
export type MCPConfig = z.infer<typeof mcpConfigSchema>;

// Server status types
export type MCPServerAvailable = {
  status: 'available';
  tools: ToolSet;
  config: MCPServerConfig;
};

export type MCPServerUnavailable = {
  status: 'unavailable';
  error: string;
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
