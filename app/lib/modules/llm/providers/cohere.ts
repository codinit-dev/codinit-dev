import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createCohere } from '@ai-sdk/cohere';

export default class CohereProvider extends BaseProvider {
  name = 'Cohere';
  getApiKeyLink = 'https://dashboard.cohere.com/api-keys';
  icon = '/thirdparty/logos/cohere.svg';

  config = {
    apiTokenKey: 'COHERE_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * Command R7B: 128k context, latest production model
     */
    {
      name: 'command-r7b-12-2024',
      label: 'Command R7B',
      provider: 'Cohere',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4000,
    },

    // Command R Plus: 128k context, enhanced reasoning
    {
      name: 'command-r-plus-08-2024',
      label: 'Command R Plus',
      provider: 'Cohere',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4000,
    },

    // Command R: 128k context, standard model
    {
      name: 'command-r-08-2024',
      label: 'Command R',
      provider: 'Cohere',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4000,
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
      defaultApiTokenKey: 'COHERE_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const cohere = createCohere({
      apiKey,
    });

    return cohere(model);
  }
}
