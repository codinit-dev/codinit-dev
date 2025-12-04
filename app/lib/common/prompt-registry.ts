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

export interface PromptInfo {
  id: string;
  label: string;
  description: string;
  version: number;
  category: 'core' | 'standard' | 'experimental';
  tokenEstimate?: number;
}

export interface PromptDefinition extends PromptInfo {
  get: (options: PromptOptions) => string;
}

export interface PromptStats {
  promptId: string;
  usageCount: number;
  lastUsed: Date;
  avgTokens?: number;
}

class PromptRegistryImpl {
  #prompts: Map<string, PromptDefinition> = new Map();
  #stats: Map<string, PromptStats> = new Map();

  constructor() {
    this.#registerDefaults();
  }

  #registerDefaults() {
    this.register({
      id: 'base',
      label: 'Universal Standards (Core)',
      description: 'Framework-agnostic universal standards and best practices that always apply',
      version: 1,
      category: 'core',
      tokenEstimate: 2000,
      get: () => getBasePrompt(),
    });

    this.register({
      id: 'default',
      label: 'Default Prompt',
      description: 'Battle-tested default system prompt with comprehensive guidelines',
      version: 2,
      category: 'standard',
      tokenEstimate: 15000,
      get: (options) => getSystemPrompt(options.cwd, options.supabase),
    });

    this.register({
      id: 'enhanced',
      label: 'Fine Tuned Prompt',
      description: 'Fine-tuned prompt optimized for better results with advanced techniques',
      version: 2,
      category: 'standard',
      tokenEstimate: 12000,
      get: (options) => getFineTunedPrompt(options.cwd, options.supabase),
    });

    this.register({
      id: 'optimized',
      label: 'Optimized Prompt (experimental)',
      description: 'Experimental version optimized for lower token usage',
      version: 1,
      category: 'experimental',
      tokenEstimate: 8000,
      get: (options) => optimized(options),
    });
  }

  register(definition: PromptDefinition): void {
    this.#prompts.set(definition.id, definition);
  }

  unregister(id: string): boolean {
    return this.#prompts.delete(id);
  }

  get(id: string, options: PromptOptions): string {
    const definition = this.#prompts.get(id);

    if (!definition) {
      const available = this.list().map((p) => p.id);
      throw new Error(`Prompt "${id}" not found. Available prompts: ${available.join(', ')}`);
    }

    this.#recordUsage(id);

    return definition.get(options);
  }

  getInfo(id: string): PromptInfo | undefined {
    const definition = this.#prompts.get(id);

    if (!definition) {
      return undefined;
    }

    const { get: _, ...info } = definition;

    return info;
  }

  list(): PromptInfo[] {
    return Array.from(this.#prompts.values()).map(({ get: _, ...info }) => info);
  }

  listByCategory(category: PromptInfo['category']): PromptInfo[] {
    return this.list().filter((p) => p.category === category);
  }

  has(id: string): boolean {
    return this.#prompts.has(id);
  }

  getStats(id: string): PromptStats | undefined {
    return this.#stats.get(id);
  }

  getAllStats(): PromptStats[] {
    return Array.from(this.#stats.values());
  }

  #recordUsage(id: string): void {
    const existing = this.#stats.get(id);

    if (existing) {
      this.#stats.set(id, {
        ...existing,
        usageCount: existing.usageCount + 1,
        lastUsed: new Date(),
      });
    } else {
      this.#stats.set(id, {
        promptId: id,
        usageCount: 1,
        lastUsed: new Date(),
      });
    }
  }

  updateStats(id: string, tokenCount: number): void {
    const existing = this.#stats.get(id);

    if (existing) {
      const newAvg = existing.avgTokens
        ? (existing.avgTokens * (existing.usageCount - 1) + tokenCount) / existing.usageCount
        : tokenCount;

      this.#stats.set(id, {
        ...existing,
        avgTokens: newAvg,
      });
    }
  }
}

const promptRegistryInstance = new PromptRegistryImpl();

export { promptRegistryInstance as PromptRegistry };

export class PromptLibrary {
  static library = {
    base: {
      label: 'Universal Standards (Core)',
      description: 'Framework-agnostic universal standards and best practices that always apply',
      get: (options: PromptOptions) => promptRegistryInstance.get('base', options),
    },
    default: {
      label: 'Default Prompt',
      description: 'Battle-tested default system prompt with comprehensive guidelines',
      get: (options: PromptOptions) => promptRegistryInstance.get('default', options),
    },
    enhanced: {
      label: 'Fine Tuned Prompt',
      description: 'Fine-tuned prompt optimized for better results with advanced techniques',
      get: (options: PromptOptions) => promptRegistryInstance.get('enhanced', options),
    },
    optimized: {
      label: 'Optimized Prompt (experimental)',
      description: 'Experimental version optimized for lower token usage',
      get: (options: PromptOptions) => promptRegistryInstance.get('optimized', options),
    },
  };

  static getList() {
    return promptRegistryInstance.list().map(({ id, label, description }: PromptInfo) => ({
      id,
      label,
      description,
    }));
  }

  static getPropmtFromLibrary(promptId: string, options: PromptOptions): string {
    return promptRegistryInstance.get(promptId, options);
  }

  static getPromptFromLibrary(promptId: string, options: PromptOptions): string {
    return promptRegistryInstance.get(promptId, options);
  }
}
