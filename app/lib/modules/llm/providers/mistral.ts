import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export default class MistralProvider extends BaseProvider {
  name = 'Mistral';
  getApiKeyLink = 'https://console.mistral.ai/api-keys/';
  icon = '/thirdparty/logos/mistral.svg';

  config = {
    apiTokenKey: 'MISTRAL_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * Mistral Large 3: 128k context, latest flagship model
     */
    {
      name: 'mistral-large-2411',
      label: 'Mistral Large 3',
      provider: 'Mistral',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Mistral Small 3: 128k context, efficient model
    {
      name: 'mistral-small-2501',
      label: 'Mistral Small 3',
      provider: 'Mistral',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Codestral 3: 128k context, coding model
    {
      name: 'codestral-2501',
      label: 'Codestral 3',
      provider: 'Mistral',
      maxTokenAllowed: 128000,
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
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const mistral = createMistral({
      apiKey,
    });

    return mistral(model);
  }
}
