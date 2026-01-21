import type { ToolInvocation } from 'ai';
import type { AbsolutePath, RelativePath } from './utils/workDir.js';
import type { Tool } from 'ai';
import type { npmInstallToolParameters } from './tools/npmInstall.js';
import type { editToolParameters } from './tools/edit.js';
import type { viewParameters } from './tools/view.js';
import type { lookupDocsParameters } from './tools/lookupDocs.js';
import type { z } from 'zod';
import type { addEnvironmentVariablesParameters } from './tools/addEnvironmentVariables.js';
import type { getCodinitDeploymentNameParameters } from './tools/getCodinitDeploymentName.js';

export type CodinitProject = {
  token: string;
  deploymentName: string;
  deploymentUrl: string;
  projectSlug: string;
  teamSlug: string;
};

export interface SystemPromptOptions {
  enableBulkEdits: boolean;
  includeTemplate: boolean;
  openaiProxyEnabled: boolean;
  usingOpenAi: boolean;
  usingGoogle: boolean;
  resendProxyEnabled: boolean;
  enableResend: boolean;
}

export interface CodinitArtifactData {
  id: string;
  title: string;
  type?: string | undefined;
}

export type ActionType = 'file' | 'toolUse' | 'shell' | 'start' | 'build' | 'supabase';

export interface FileAction {
  type: 'file';
  filePath: RelativePath;
  isEdit?: boolean;
  content: string;
}

export interface ToolUseAction {
  type: 'toolUse';
  toolName: string;
  parsedContent: ToolInvocation;
  // Serialized content to use for de-duping
  content: string;
}

export interface BaseAction {
  content: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface BuildAction extends BaseAction {
  type: 'build';
}

export interface SupabaseAction extends BaseAction {
  type: 'supabase';
  operation: 'migration' | 'query';
  filePath?: string;
  projectId?: string;
}

export type CodinitAction = FileAction | ToolUseAction | ShellAction | StartAction | BuildAction | SupabaseAction;

export type CodinitActionData = CodinitAction;

export interface EditorDocument {
  value: string;
  isBinary: boolean;
  filePath: AbsolutePath;
  scroll?: ScrollPosition;
}

export interface ScrollPosition {
  top: number;
  left: number;
}

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Folder {
  type: 'folder';
}

export type EmptyArgs = z.ZodObject<Record<string, never>>;

export type CodinitToolSet = {
  deploy: Tool<EmptyArgs, string>;
  npmInstall: Tool<typeof npmInstallToolParameters, string>;
  lookupDocs: Tool<typeof lookupDocsParameters, string>;
  addEnvironmentVariables?: Tool<typeof addEnvironmentVariablesParameters, void>;
  view?: Tool<typeof viewParameters, string>;
  edit?: Tool<typeof editToolParameters, string>;
  getCodinitDeploymentName: Tool<typeof getCodinitDeploymentNameParameters, string>;
};

export type CodinitToolName = keyof CodinitToolSet;

export type Dirent = File | Folder;

export type FileMap = Record<AbsolutePath, Dirent | undefined>;
