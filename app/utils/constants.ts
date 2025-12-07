import { LLMManager } from '~/lib/modules/llm/manager';
import type { Template } from '~/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'codinit_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

export const TOOL_EXECUTION_APPROVAL = {
  APPROVE: 'tool_execution_approved',
  REJECT: 'tool_execution_rejected',
};
export const TOOL_EXECUTION_DENIED = 'tool_execution_denied';
export const TOOL_EXECUTION_ERROR = 'tool_execution_error';
export const TOOL_NO_EXECUTE_FUNCTION = 'tool_no_execute_function';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Next.js',
    label: 'Next.js',
    description: 'Next.js shadcn starter template using the App Router for building modern React applications',
    githubRepo: 'codinit-dev/codinit-nextjs',
    icon: 'i-codinit:nextjs',
  },
  {
    name: 'Expo',
    label: 'Expo',
    description: 'Expo starter template for building cross-platform mobile apps with native code access',
    githubRepo: 'codinit-dev/expo-starter',
    icon: 'i-codinit:expo',
  },
  {
    name: 'shadcn/ui Vite React',
    label: 'Vite + React + shadcn/ui',
    description: 'Vite React starter with shadcn/ui components for fast development',
    githubRepo: 'codinit-dev/vite-shadcn',
    icon: 'i-codinit:shadcn',
  },
  {
    name: 'Astro',
    label: 'Astro',
    description: 'Astro starter template for building fast, content-focused websites',
    githubRepo: 'codinit-dev/astro',
    icon: 'i-codinit:astro',
  },
  {
    name: 'Typescript',
    label: 'Typescript',
    description: 'Typescript starter template for building fast, efficient web applications',
    githubRepo: 'codinit-dev/typescript',
    icon: 'i-codinit:typescript',
  },
  {
    name: 'Vite React TS',
    label: 'Vite + React + TypeScript',
    description: 'Vite React TypeScript starter for fast development experience',
    githubRepo: 'codinit-dev/vite-react-ts-starter',
    icon: 'i-codinit:vite',
  },
  {
    name: 'Angular',
    label: 'Angular',
    description: 'Modern Angular starter with standalone components and TypeScript',
    githubRepo: 'codinit-dev/angular',
    icon: 'i-codinit:angular',
  },
  {
    name: 'Qwik',
    label: 'Qwik',
    description: 'Modern Qwik starter with standalone components and TypeScript',
    githubRepo: 'codinit-dev/qwik',
    icon: 'i-codinit:qwik',
  },
];
