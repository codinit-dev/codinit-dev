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
  APPROVE: 'Yes, approved.',
  REJECT: 'No, rejected.',
} as const;
export const TOOL_NO_EXECUTE_FUNCTION = 'Error: No execute function found on tool';
export const TOOL_EXECUTION_DENIED = 'Error: User denied access to tool execution';
export const TOOL_EXECUTION_ERROR = 'Error: An error occured while calling tool';

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

/**
 * Starter Templates
 *
 * GitHub repository paths support two formats:
 * 1. Basic: "owner/repo" - Fetches from repository root
 * 2. Subdirectory: "owner/repo/path/to/subdirectory" - Fetches specific subdirectory
 *
 * Templates use well-known public repositories with verified starter templates:
 * - vercel/next.js (Next.js official examples)
 * - shadcn-ui/next-shadcn (shadcn/ui templates)
 * - expo/examples (Expo official examples)
 * - sveltejs/kit (SvelteKit template)
 * - vitejs/awesome-vite (Vite templates)
 */
export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Next.js App Router',
    label: 'Next.js App Router',
    description: 'Next.js starter template using the App Router for building modern React applications',
    githubRepo: 'https://github.com/codinit-dev/nextjs.git',
    icon: 'i-codinit:nextjs',
  },
  {
    name: 'Expo',
    label: 'Expo',
    description: 'Expo starter template for building cross-platform mobile apps with native code access',
    githubRepo: 'https://github.com/codinit-dev/expo.git',
    icon: 'i-codinit:expo',
  },
  {
    name: 'shadcn/ui Vite React',
    label: 'Vite + React + shadcn/ui',
    description: 'Vite React starter with shadcn/ui components for fast development',
    githubRepo: 'https://github.com/codinit-dev/vite-shadcn.git',
    icon: 'i-codinit:react',
  },
  {
    name: 'Astro',
    label: 'Astro',
    description: 'Astro starter template for building fast, content-focused websites',
    githubRepo: 'https://github.com/codinit-dev/astro.git',
    icon: 'i-codinit:astro',
  },
  {
    name: 'Typescript',
    label: 'Typescript',
    description: 'Typescript starter template for building fast, efficient web applications',
    githubRepo: 'https://github.com/codinit-dev/typescript.git',
    icon: 'i-codinit:typescript',
  },
  {
    name: 'Vite React TS',
    label: 'Vite + React + TypeScript',
    description: 'Vite React TypeScript starter for fast development experience',
    githubRepo: 'https://github.com/simerlec/vite-react-ts-starter.git',
    icon: 'i-codinit:vite',
  },
  {
    name: 'Angular',
    label: 'Angular',
    description: 'Modern Angular starter with standalone components and TypeScript',
    githubRepo: 'https://github.com/codinit-dev/angular.git',
    icon: 'i-codinit:angular',
  },
  {
    name: 'Qwik',
    label: 'Qwik',
    description: 'Modern Qwik starter with standalone components and TypeScript',
    githubRepo: 'https://github.com/codinit-dev/qwik.git',
    icon: 'i-codinit:qwik',
  },
];
