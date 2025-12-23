import type { z } from 'zod';
import type { FilesStore } from '~/lib/stores/files';
import type { ActionRunner } from '~/lib/runtime/action-runner';
import type { WebContainer } from '@webcontainer/api';
import type { ToolResult } from '~/types';

export interface ToolContext {
  workingDirectory: string;
  webcontainer: WebContainer;
  filesStore: FilesStore;
  actionRunner: ActionRunner;
  [key: string]: any;
}

export interface AgentTool<TInput = any> {
  name: string;
  description: string;
  parameters: z.ZodSchema<TInput>;
  execute: (args: TInput, context: ToolContext) => Promise<ToolResult>;
  validate?: (args: TInput) => boolean;
  timeout?: number;
}

export interface ToolExecutorOptions {
  defaultTimeout?: number;
  maxConcurrent?: number;
}

export type ToolRegistry = Map<string, AgentTool>;
