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
 * All templates use the monorepo format: "codinit-dev/starters/template-name"
 * Where:
 * - owner: codinit-dev
 * - repo: starters
 * - subdirectory: template-name (e.g., codinit-expo, astro-shadcn, nextjs-shadcn)
 *
 * Template directories must match exactly with the directory names in the starters repository:
 * https://github.com/codinit-dev/starters
 */
export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Expo App',
    label: 'Expo App',
    description: 'Expo starter template for building cross-platform mobile apps',
    githubRepo: 'codinit-dev/starters/codinit-expo',
    tags: ['mobile', 'expo', 'mobile-app', 'android', 'iphone'],
    icon: 'i-codinit:expo',
  },
  {
    name: 'Astro Shadcn',
    label: 'Astro + shadcn/ui',
    description: 'Astro starter template integrated with shadcn/ui components for building fast static websites',
    githubRepo: 'codinit-dev/starters/astro-shadcn',
    tags: ['astro', 'blog', 'performance', 'shadcn'],
    icon: 'i-codinit:astro',
  },
  {
    name: 'NextJS Shadcn',
    label: 'Next.js with shadcn/ui',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'codinit-dev/starters/nextjs-shadcn',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-codinit:nextjs',
  },
  {
    name: 'Next.JS',
    label: 'Next.js',
    description: 'Next.js starter template for building full-stack React applications',
    githubRepo: 'codinit-dev/starters/nextjs',
    tags: ['nextjs', 'react', 'typescript', 'fullstack'],
    icon: 'i-codinit:nextjs',
  },
  {
    name: 'Vite Shadcn',
    label: 'Vite with shadcn/ui',
    description: 'Vite starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'codinit-dev/starters/vite-shadcn',
    tags: ['vite', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-codinit:shadcn',
  },
  {
    name: 'Qwik Typescript',
    label: 'Qwik TypeScript',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    githubRepo: 'codinit-dev/starters/codinit-qwik',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-codinit:qwik',
  },

  /*
   * Note: Remix template not available in starters repo yet
   * {
   *   name: 'Remix Typescript',
   *   label: 'Remix TypeScript',
   *   description: 'Remix framework starter with TypeScript for full-stack web applications',
   *   githubRepo: 'codinit-dev/starters/remix',
   *   tags: ['remix', 'typescript', 'fullstack', 'react'],
   *   icon: 'i-codinit:remix',
   * },
   */
  {
    name: 'Slidev',
    label: 'Slidev Presentation',
    description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
    githubRepo: 'codinit-dev/starters/slidev',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: 'i-codinit:slidev',
  },
  {
    name: 'Sveltekit',
    label: 'SvelteKit',
    description: 'SvelteKit starter template for building fast, efficient web applications',
    githubRepo: 'codinit-dev/starters/sveltekit',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: 'i-codinit:svelte',
  },
  {
    name: 'Vanilla JavaScript',
    label: 'Vanilla JS',
    description: 'Minimal JavaScript starter template for simple projects',
    githubRepo: 'codinit-dev/starters/js',
    tags: ['javascript', 'vanilla-js', 'minimal'],
    icon: 'i-codinit:javascript',
  },
  {
    name: 'Vite React',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'codinit-dev/starters/codinit-vite-react-ts',
    tags: ['react', 'vite', 'frontend', 'website', 'app'],
    icon: 'i-codinit:react',
  },
  {
    name: 'TypeScript',
    label: 'TypeScript',
    description: 'Basic TypeScript starter template for type-safe development',
    githubRepo: 'codinit-dev/starters/typescript',
    tags: ['typescript', 'minimal'],
    icon: 'i-codinit:typescript',
  },
  {
    name: 'Vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    githubRepo: 'codinit-dev/starters/vue',
    tags: ['vue', 'typescript', 'frontend'],
    icon: 'i-codinit:vue',
  },
  {
    name: 'Angular',
    label: 'Angular Starter',
    description: 'A modern Angular starter template with TypeScript support and best practices configuration',
    githubRepo: 'codinit-dev/starters/angular',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-codinit:angular',
  },

  /*
   * Note: SolidJS template not available in starters repo yet
   * {
   *   name: 'SolidJS',
   *   label: 'SolidJS Tailwind',
   *   description: 'Lightweight SolidJS starter template for building fast static websites',
   *   githubRepo: 'codinit-dev/starters/solidjs',
   *   tags: ['solidjs'],
   *   icon: 'i-codinit:solidjs',
   * },
   */
];
