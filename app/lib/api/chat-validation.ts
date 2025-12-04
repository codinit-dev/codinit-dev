import { z } from 'zod';
import type { FileMap } from '~/lib/.server/llm/constants';
import type { DesignScheme } from '~/types/design-scheme';
import type { Messages } from '~/lib/.server/llm/stream-text';

const messageSchema = z
  .object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'data']),
    content: z.string(),
    createdAt: z.any().optional(),
  })
  .passthrough();

const supabaseConfigSchema = z.object({
  isConnected: z.boolean(),
  hasSelectedProject: z.boolean(),
  credentials: z
    .object({
      anonKey: z.string().optional(),
      supabaseUrl: z.string().optional(),
    })
    .optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1, 'At least one message is required'),
  files: z.record(z.string(), z.any()).default({}),
  promptId: z.string().optional(),
  contextOptimization: z.boolean().default(false),
  designScheme: z.any().optional(),
  supabase: supabaseConfigSchema.optional(),
  enableMCPTools: z.boolean().default(false),
});

export interface ValidatedChatRequest {
  messages: Messages;
  files: FileMap;
  promptId?: string;
  contextOptimization: boolean;
  designScheme?: DesignScheme;
  supabase?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
  enableMCPTools: boolean;
}

export function validateChatRequest(data: unknown): ValidatedChatRequest {
  const parsed = chatRequestSchema.parse(data);
  return parsed as ValidatedChatRequest;
}

export type ChatErrorType =
  | 'validation_error'
  | 'auth_error'
  | 'rate_limit'
  | 'model_not_found'
  | 'context_too_large'
  | 'mcp_tool_error'
  | 'timeout'
  | 'stream_error'
  | 'provider_error'
  | 'unknown';

export interface ChatError {
  type: ChatErrorType;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export function createChatError(type: ChatErrorType, message: string, details?: Record<string, unknown>): ChatError {
  const retryableTypes: ChatErrorType[] = ['rate_limit', 'timeout', 'stream_error'];
  return {
    type,
    message,
    details,
    retryable: retryableTypes.includes(type),
  };
}

export function formatValidationErrors(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export function categorizeError(error: unknown): ChatError {
  if (error instanceof z.ZodError) {
    return createChatError('validation_error', formatValidationErrors(error), {
      errors: error.errors,
    });
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('authentication')) {
      return createChatError('auth_error', 'Invalid or missing API key', {
        originalMessage: error.message,
      });
    }

    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
      return createChatError('rate_limit', 'Rate limit exceeded. Please try again later.', {
        originalMessage: error.message,
      });
    }

    if (message.includes('model') && (message.includes('not found') || message.includes('does not exist'))) {
      return createChatError('model_not_found', 'The requested model is not available', {
        originalMessage: error.message,
      });
    }

    if (message.includes('context') && (message.includes('too large') || message.includes('token'))) {
      return createChatError('context_too_large', 'The context is too large for this model', {
        originalMessage: error.message,
      });
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return createChatError('timeout', 'Request timed out. Please try again.', {
        originalMessage: error.message,
      });
    }

    if (message.includes('mcp') || message.includes('tool')) {
      return createChatError('mcp_tool_error', 'MCP tool execution failed', {
        originalMessage: error.message,
      });
    }

    return createChatError('provider_error', error.message);
  }

  return createChatError('unknown', 'An unexpected error occurred');
}

export function getHttpStatusForError(error: ChatError): number {
  switch (error.type) {
    case 'validation_error':
      return 400;
    case 'auth_error':
      return 401;
    case 'rate_limit':
      return 429;
    case 'model_not_found':
      return 404;
    case 'context_too_large':
      return 413;
    case 'timeout':
      return 504;
    default:
      return 500;
  }
}

export const CHAT_TIMEOUT_MS = 5 * 60 * 1000;

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = CHAT_TIMEOUT_MS,
  operationName: string = 'Operation',
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);

    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}
