import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

interface OpenRouterModel {
  name: string;
  id: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export default class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/settings/keys';
  icon = '/thirdparty/logos/openrouter.svg';

  config = {
    apiTokenKey: 'OPEN_ROUTER_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * Claude 3.5 Sonnet via OpenRouter: 200k context
     */
    {
      name: 'anthropic/claude-3.5-sonnet',
      label: 'Claude 3.5 Sonnet',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    // GPT-4o via OpenRouter: 128k context
    {
      name: 'openai/gpt-4o',
      label: 'GPT-4o',
      provider: 'OpenRouter',
      maxTokenAllowed: 128000,
    },

    // GPT-5 series - latest flagship models
    {
      name: 'openai/gpt-5',
      label: 'GPT-5',
      provider: 'OpenRouter',
      maxTokenAllowed: 400000,
    },

    {
      name: 'openai/gpt-5-mini',
      label: 'GPT-5 Mini',
      provider: 'OpenRouter',
      maxTokenAllowed: 400000,
    },

    // Latest reasoning models
    {
      name: 'openai/o3',
      label: 'OpenAI o3',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    {
      name: 'openai/o4-mini',
      label: 'OpenAI o4 Mini',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    {
      name: 'openai/o1',
      label: 'OpenAI o1',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    // Latest Claude models
    {
      name: 'anthropic/claude-sonnet-4.5',
      label: 'Claude Sonnet 4.5',
      provider: 'OpenRouter',
      maxTokenAllowed: 1000000,
    },

    {
      name: 'anthropic/claude-opus-4.1',
      label: 'Claude Opus 4.1',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    {
      name: 'anthropic/claude-opus-4',
      label: 'Claude Opus 4',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    {
      name: 'anthropic/claude-sonnet-4',
      label: 'Claude Sonnet 4',
      provider: 'OpenRouter',
      maxTokenAllowed: 1000000,
    },

    {
      name: 'anthropic/claude-3.7-sonnet',
      label: 'Claude 3.7 Sonnet',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    // Latest Gemini models
    {
      name: 'google/gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      provider: 'OpenRouter',
      maxTokenAllowed: 1048576,
    },

    {
      name: 'google/gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      provider: 'OpenRouter',
      maxTokenAllowed: 1048576,
    },

    {
      name: 'google/gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      provider: 'OpenRouter',
      maxTokenAllowed: 1048576,
    },

    // Latest Qwen models
    {
      name: 'qwen/qwen3-max',
      label: 'Qwen3 Max',
      provider: 'OpenRouter',
      maxTokenAllowed: 256000,
    },

    {
      name: 'qwen/qwen3-coder-plus',
      label: 'Qwen3 Coder Plus',
      provider: 'OpenRouter',
      maxTokenAllowed: 128000,
    },

    {
      name: 'qwen/qwen3-235b-a22b',
      label: 'Qwen3 235B A22B',
      provider: 'OpenRouter',
      maxTokenAllowed: 262144,
    },

    // Latest Llama models
    {
      name: 'meta-llama/llama-4-maverick',
      label: 'Llama 4 Maverick',
      provider: 'OpenRouter',
      maxTokenAllowed: 1048576,
    },

    {
      name: 'meta-llama/llama-4-scout',
      label: 'Llama 4 Scout',
      provider: 'OpenRouter',
      maxTokenAllowed: 327680,
    },

    {
      name: 'meta-llama/llama-3.3-70b-instruct',
      label: 'Llama 3.3 70B Instruct',
      provider: 'OpenRouter',
      maxTokenAllowed: 131072,
    },

    // Popular reasoning models
    {
      name: 'qwen/qwq-32b',
      label: 'Qwen QwQ 32B',
      provider: 'OpenRouter',
      maxTokenAllowed: 32768,
    },

    {
      name: 'mistralai/magistral-medium-2506',
      label: 'Mistral Magistral Medium 2506',
      provider: 'OpenRouter',
      maxTokenAllowed: 40960,
    },

    // Multimodal models
    {
      name: 'openai/gpt-5-image',
      label: 'GPT-5 Image',
      provider: 'OpenRouter',
      maxTokenAllowed: 400000,
    },

    {
      name: 'google/gemini-2.5-flash-image',
      label: 'Gemini 2.5 Flash Image',
      provider: 'OpenRouter',
      maxTokenAllowed: 32768,
    },

    {
      name: 'qwen/qwen3-vl-235b-a22b',
      label: 'Qwen3 VL 235B A22B',
      provider: 'OpenRouter',
      maxTokenAllowed: 262144,
    },

    // Deep research models
    {
      name: 'openai/o3-deep-research',
      label: 'OpenAI o3 Deep Research',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },

    {
      name: 'openai/o4-mini-deep-research',
      label: 'OpenAI o4 Mini Deep Research',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as OpenRouterModelsResponse;

      return data.data
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((m) => {
          // Get accurate context window from OpenRouter API
          const contextWindow = m.context_length || 32000; // Use API value or fallback

          // Cap at reasonable limits to prevent issues (OpenRouter has some very large models)
          const maxAllowed = 1000000; // 1M tokens max for safety
          const finalContext = Math.min(contextWindow, maxAllowed);

          return {
            name: m.id,
            label: `${m.name} - in:$${(m.pricing.prompt * 1_000_000).toFixed(2)} out:$${(m.pricing.completion * 1_000_000).toFixed(2)} - context ${finalContext >= 1000000 ? Math.floor(finalContext / 1000000) + 'M' : Math.floor(finalContext / 1000) + 'k'}`,
            provider: this.name,
            maxTokenAllowed: finalContext,
          };
        });
    } catch (error) {
      console.error('Error getting OpenRouter models:', error);
      return [];
    }
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
      defaultApiTokenKey: 'OPEN_ROUTER_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openRouter = createOpenRouter({
      apiKey,
    });
    const instance = openRouter.chat(model) as LanguageModelV1;

    return instance;
  }
}
