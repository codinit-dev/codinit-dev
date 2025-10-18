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

// Action runner configuration
export const ACTION_STREAM_SAMPLE_INTERVAL = 100; // milliseconds - controls how often actions are sampled during streaming

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
    name: 'Expo App',
    label: 'Expo App',
    description: 'Expo starter template for building cross-platform mobile apps',
    source: 'local',
    localPath: 'codinit-expo',
    tags: ['mobile', 'expo', 'mobile-app', 'android', 'iphone'],
    icon: 'i-codinit:expo',
  },
  {
    name: 'Basic Astro',
    label: 'Astro Basic',
    description: 'Lightweight Astro starter template for building fast static websites',
    source: 'local',
    localPath: 'astro-shadcn',
    tags: ['astro', 'blog', 'performance'],
    icon: 'i-codinit:astro',
  },
  {
    name: 'Next.JS',
    label: 'Next.js with shadcn/ui',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
    source: 'local',
    localPath: 'nextjs-shadcn',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-codinit:nextjs',
  },
  {
    name: 'Vite Shadcn',
    label: 'Vite with shadcn/ui',
    description: 'Vite starter fullstack template integrated with shadcn/ui components and styling system',
    source: 'local',
    localPath: 'vite-shadcn',
    tags: ['vite', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-codinit:shadcn',
  },
  {
    name: 'Qwik Typescript',
    label: 'Qwik TypeScript',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    source: 'local',
    localPath: 'codinit-qwik',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-codinit:qwik',
  },
  {
    name: 'Slidev',
    label: 'Slidev Presentation',
    description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
    source: 'local',
    localPath: 'slidev',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: 'i-codinit:slidev',
  },
  {
    name: 'Sveltekit',
    label: 'SvelteKit',
    description: 'SvelteKit starter template for building fast, efficient web applications',
    source: 'local',
    localPath: 'sveltekit',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: 'i-codinit:svelte',
  },
  {
    name: 'Vite React',
    label: 'React + Vite + TypeScript',
    description: 'React starter template powered by Vite for fast development experience (DEFAULT)',
    source: 'local',
    localPath: 'codinit-vite-react-ts',
    tags: ['react', 'vite', 'frontend', 'website', 'app', 'default'],
    icon: 'i-codinit:react',
  },
  {
    name: 'Vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    source: 'local',
    localPath: 'vue',
    tags: ['vue', 'typescript', 'frontend'],
    icon: 'i-codinit:vue',
  },
  {
    name: 'Angular',
    label: 'Angular Starter',
    description: 'A modern Angular starter template with TypeScript support and best practices configuration',
    source: 'local',
    localPath: 'angular',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-codinit:angular',
  },
];
