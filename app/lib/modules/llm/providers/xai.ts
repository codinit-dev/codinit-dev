import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class XAIProvider extends BaseProvider {
  name = 'xAI';
  getApiKeyLink = 'https://docs.x.ai/docs/quickstart#creating-an-api-key';
  icon = '/thirdparty/logos/xai.svg';

  config = {
    apiTokenKey: 'XAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * Grok-2: 128k context, latest reasoning model
     */
    {
      name: 'grok-2-1212',
      label: 'Grok-2',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
    },

    // Grok-2 mini: 128k context, faster model
    {
      name: 'grok-2-mini',
      label: 'Grok-2 Mini',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 16384,
    },

    // Grok-1.5: 128k context, previous generation
    {
      name: 'grok-1.5',
      label: 'Grok-1.5',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },
  ];

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
      defaultApiTokenKey: 'XAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey,
    });

    return openai(model);
  }
}
