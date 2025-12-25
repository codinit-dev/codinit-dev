import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo, ProviderConfig } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { IProviderSetting } from '~/types/model';

export default class CodinITProvider extends BaseProvider {
  name = 'CodinIT';
  getApiKeyLink = 'https://api.codinit.dev/settings';
  labelForGetApiKey = 'Get CodinIT Pro API Key';
  icon = 'i-codinit:codinit';

  config: ProviderConfig = {
    apiTokenKey: 'CODINIT_PRO_API_KEY',
    baseUrl: 'http://localhost:3001/v1', // Default local backend
  };

  staticModels: ModelInfo[] = [
    {
      name: 'gpt-4o',
      label: 'CodinIT Pro (GPT-4o)',
      provider: 'CodinIT',
      maxTokenAllowed: 8000,
    },
    {
      name: 'gpt-4o-mini',
      label: 'CodinIT Pro (GPT-4o Mini)',
      provider: 'CodinIT',
      maxTokenAllowed: 8000,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv?: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    codinit_options?: any;
  }): LanguageModelV1 {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys: options.apiKeys,
      providerSettings: options.providerSettings?.[this.name],
      serverEnv: options.serverEnv,
      defaultBaseUrlKey: this.config.baseUrlKey!,
      defaultApiTokenKey: this.config.apiTokenKey!,
    });

    const openai = createOpenAI({
      baseURL: baseUrl,
      apiKey,
      fetch: async (url, fetchOptions) => {
        if (fetchOptions && options.codinit_options) {
          const body = fetchOptions.body;

          if (body && typeof body === 'string') {
            try {
              const parsedBody = JSON.parse(body);
              parsedBody.codinit_options = options.codinit_options;
              fetchOptions.body = JSON.stringify(parsedBody);
            } catch (error) {
              console.error('Failed to parse request body in CodinITProvider:', error);
            }
          }
        }

        return fetch(url, fetchOptions);
      },
    });

    return openai(options.model as any);
  }
}
