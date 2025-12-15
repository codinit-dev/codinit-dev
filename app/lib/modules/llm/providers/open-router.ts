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
     * Claude Opus 4.5 via OpenRouter: 200k context, maximum intelligence
     */
    {
      name: 'anthropic/claude-opus-4-5',
      label: 'Claude Opus 4.5',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 64000,
    },

    // Claude Sonnet 4.5 via OpenRouter: 200k context
    {
      name: 'anthropic/claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 64000,
    },

    // GPT-5.2 Pro via OpenRouter: 400k context, highest accuracy
    {
      name: 'openai/gpt-5.2-pro',
      label: 'GPT-5.2 Pro',
      provider: 'OpenRouter',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-5.2 Thinking via OpenRouter: 400k context, complex reasoning
    {
      name: 'openai/gpt-5.2-thinking',
      label: 'GPT-5.2 Thinking',
      provider: 'OpenRouter',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-5.2 Instant via OpenRouter: 400k context, optimized for speed
    {
      name: 'openai/gpt-5.2-instant',
      label: 'GPT-5.2 Instant',
      provider: 'OpenRouter',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-5.1 via OpenRouter: 128k context
    {
      name: 'openai/gpt-5.1',
      label: 'GPT-5.1',
      provider: 'OpenRouter',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },

    // DeepSeek-R1 via OpenRouter: 128k context
    {
      name: 'deepseek/deepseek-r1',
      label: 'DeepSeek-R1',
      provider: 'OpenRouter',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
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
