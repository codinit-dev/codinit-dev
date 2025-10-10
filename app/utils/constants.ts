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

// starter Templates

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
    name: 'Astro',
    label: 'Astro Shadcn',
    description: 'Astro starter template with shadcn/ui for building fast static websites',
    githubRepo: 'codinit-dev/starters/astro-shadcn',
    tags: ['astro', 'shadcn', 'performance'],
    icon: 'i-codinit:astro',
  },
  {
    name: 'NextJS',
    label: 'Next.js Shadcn',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components',
    githubRepo: 'codinit-dev/starters/nextjs-shadcn',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-codinit:nextjs',
  },
  {
    name: 'Vite',
    label: 'Vite Shadcn',
    description: 'Vite starter fullstack template integrated with shadcn/ui components',
    githubRepo: 'codinit-dev/starters/vite-shadcn',
    tags: ['vite', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-codinit:shadcn',
  },
  {
    name: 'Qwik',
    label: 'Qwik',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    githubRepo: 'codinit-dev/starters/codinit-qwik',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-codinit:qwik',
  },
  {
    name: 'Remotion',
    label: 'Remotion',
    description: 'Remotion starter template for creating videos programmatically with React',
    githubRepo: 'codinit-dev/starters/codinit-remotion',
    tags: ['remotion', 'video', 'react', 'typescript'],
    icon: 'i-codinit:remotion',
  },
  {
    name: 'Slidev',
    label: 'Slidev',
    description: 'Slidev starter template for creating developer-friendly presentations',
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
    name: 'Vite React',
    label: 'React Vite TS',
    description: 'React starter template powered by Vite with TypeScript',
    githubRepo: 'codinit-dev/starters/codinit-vite-react-ts',
    tags: ['react', 'vite', 'frontend', 'website', 'app', 'typescript'],
    icon: 'i-codinit:react',
  },
  {
    name: 'Vite Typescript',
    label: 'Vite TypeScript',
    description: 'Vite starter template with TypeScript for type-safe development',
    githubRepo: 'codinit-dev/starters/typescript',
    tags: ['vite', 'typescript', 'minimal'],
    icon: 'i-codinit:typescript',
  },
  {
    name: 'Vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    githubRepo: 'codinit-dev/starters/vue',
    tags: ['vue', 'frontend'],
    icon: 'i-codinit:vue',
  },
  {
    name: 'Angular',
    label: 'Angular',
    description: 'Modern Angular starter template with TypeScript and best practices',
    githubRepo: 'codinit-dev/starters/angular',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-codinit:angular',
  },
];
