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
     * Grok-2: 128k context, latest flagship reasoning model
     */
    {
      name: 'grok-2',
      label: 'Grok-2',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
    },

    // Grok-2 mini: 128k context, efficient variant
    {
      name: 'grok-2-mini',
      label: 'Grok-2 Mini',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
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
      defaultApiTokenKey: 'XAI_API_KEY',
    });

    if (!apiKey) {
      return this.staticModels;
    }

    try {
      const response = await fetch('https://api.x.ai/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return this.staticModels;
      }

      const res = (await response.json()) as any;
      const staticModelIds = this.staticModels.map((m) => m.name);

      const data = res.data?.filter((model: any) => !staticModelIds.includes(model.id)) || [];

      return data.map((m: any) => ({
        name: m.id,
        label: m.id,
        provider: this.name,
        maxTokenAllowed: 131072,
        maxCompletionTokens: 8192,
      }));
    } catch {
      return this.staticModels;
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
