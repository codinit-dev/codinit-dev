import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';
import { getFineTunedPrompt } from './prompts/fine-tuned';
import { getBasePrompt } from './prompts/base-prompt';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
  supabase?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    base: {
      label: 'Universal Standards (Core)',
      description: 'Framework-agnostic universal standards and best practices that always apply',
      get: () => getBasePrompt(),
    },
    default: {
      label: 'Default Prompt',
      description: 'Battle-tested default system prompt with comprehensive guidelines',
      get: (options) => getSystemPrompt(options.cwd, options.supabase),
    },
    enhanced: {
      label: 'Fine Tuned Prompt',
      description: 'Fine-tuned prompt optimized for better results with advanced techniques',
      get: (options) => getFineTunedPrompt(options.cwd, options.supabase),
    },
    optimized: {
      label: 'Optimized Prompt (experimental)',
      description: 'Experimental version optimized for lower token usage',
      get: (options) => optimized(options),
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw 'Prompt Now Found';
    }

    return this.library[promptId]?.get(options);
  }
}
