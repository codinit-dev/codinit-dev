import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';
  icon = '/thirdparty/logos/openai.svg';

  config = {
    apiTokenKey: 'OPENAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * GPT-5.2 Pro: 400k context, 128k output, highest accuracy and quality
     */
    {
      name: 'gpt-5.2-pro',
      label: 'GPT-5.2 Pro',
      provider: 'OpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-5.2 Thinking: 400k context, 128k output, for complex reasoning and coding
    {
      name: 'gpt-5.2-thinking',
      label: 'GPT-5.2 Thinking',
      provider: 'OpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-5.2 Instant: 400k context, 128k output, optimized for speed
    {
      name: 'gpt-5.2-instant',
      label: 'GPT-5.2 Instant',
      provider: 'OpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-5.1: 128k context, 16k output limit (best for coding and agentic tasks)
    {
      name: 'gpt-5.1',
      label: 'GPT-5.1',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },

    // GPT-5 mini: 128k context, 8k output limit (faster, cheaper version)
    {
      name: 'gpt-5-mini',
      label: 'GPT-5 Mini',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // GPT-5 nano: 128k context, 4k output limit (fastest, cheapest version)
    {
      name: 'gpt-5-nano',
      label: 'GPT-5 Nano',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },

    // GPT-4.1: 128k context, 16k output limit (new GPT-4 series)
    {
      name: 'gpt-4.1',
      label: 'GPT-4.1',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },

    // GPT-4.1 mini: 128k context, 8k output limit
    {
      name: 'gpt-4.1-mini',
      label: 'GPT-4.1 Mini',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // o4-mini: 128k context, 65k output limit (reasoning model)
    {
      name: 'o4-mini',
      label: 'o4-mini',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 65000,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    const response = await fetch(`https://api.openai.com/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const res = (await response.json()) as any;
    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter(
      (model: any) =>
        model.object === 'model' &&
        (model.id.startsWith('gpt-') || model.id.startsWith('o') || model.id.startsWith('chatgpt-')) &&
        !staticModelIds.includes(model.id),
    );

    return data.map((m: any) => {
      // Get accurate context window from OpenAI API
      let contextWindow = 32000; // default fallback

      // OpenAI provides context_length in their API response
      if (m.context_length) {
        contextWindow = m.context_length;
      } else if (m.id?.includes('gpt-5.2')) {
        contextWindow = 400000; // GPT-5.2 has 400k context
      } else if (m.id?.includes('gpt-5.1')) {
        contextWindow = 128000; // GPT-5.1 has 128k context
      } else if (m.id?.includes('gpt-5')) {
        contextWindow = 128000; // Other GPT-5 models have 128k context
      } else if (m.id?.includes('gpt-4o')) {
        contextWindow = 128000; // GPT-4o has 128k context
      } else if (m.id?.includes('gpt-4-turbo') || m.id?.includes('gpt-4-1106')) {
        contextWindow = 128000; // GPT-4 Turbo has 128k context
      } else if (m.id?.includes('gpt-4')) {
        contextWindow = 8192; // Standard GPT-4 has 8k context
      } else if (m.id?.includes('gpt-3.5-turbo')) {
        contextWindow = 16385; // GPT-3.5-turbo has 16k context
      }

      // Determine completion token limits based on model type (accurate 2025 limits)
      let maxCompletionTokens = 4096; // default for most models

      if (m.id?.startsWith('o4-mini')) {
        maxCompletionTokens = 65000; // o4-mini: 65K output limit
      } else if (m.id?.startsWith('o1-preview')) {
        maxCompletionTokens = 32000; // o1-preview: 32K output limit
      } else if (m.id?.startsWith('o1-mini')) {
        maxCompletionTokens = 65000; // o1-mini: 65K output limit
      } else if (m.id?.startsWith('o1')) {
        maxCompletionTokens = 32000; // Other o1 models: 32K limit
      } else if (m.id?.includes('o3') || m.id?.includes('o4')) {
        maxCompletionTokens = 100000; // o3/o4 models: 100K output limit
      } else if (m.id?.includes('gpt-5.2')) {
        maxCompletionTokens = 128000; // GPT-5.2: 128K output limit
      } else if (m.id?.includes('gpt-5.1')) {
        maxCompletionTokens = 16384; // GPT-5.1: 16K output limit
      } else if (m.id?.includes('gpt-5-mini')) {
        maxCompletionTokens = 8192; // GPT-5 mini: 8K output limit
      } else if (m.id?.includes('gpt-5-nano')) {
        maxCompletionTokens = 4096; // GPT-5 nano: 4K output limit
      } else if (m.id?.includes('gpt-4.1')) {
        maxCompletionTokens = 16384; // GPT-4.1 series: 16K output limit
      } else if (m.id?.includes('gpt-4o')) {
        maxCompletionTokens = 4096; // GPT-4o standard: 4K (64K with long output mode)
      } else if (m.id?.includes('gpt-4')) {
        maxCompletionTokens = 8192; // Standard GPT-4: 8K output limit
      } else if (m.id?.includes('gpt-3.5-turbo')) {
        maxCompletionTokens = 4096; // GPT-3.5-turbo: 4K output limit
      }

      return {
        name: m.id,
        label: `${m.id} (${Math.floor(contextWindow / 1000)}k context)`,
        provider: this.name,
        maxTokenAllowed: Math.min(contextWindow, 400000), // Cap at 400k for safety
        maxCompletionTokens,
      };
    });
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      apiKey,
    });

    return openai(model);
  }
}
