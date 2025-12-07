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
     */
    {
      name: 'grok-4-1-fast-reasoning',
      label: 'Grok-4-1 Fast Reasoning',
      provider: 'xAI',
      maxTokenAllowed: 2000000,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-4-1-fast-non-reasoning',
      label: 'Grok-4-1 Fast Non-Reasoning',
      provider: 'xAI',
      maxTokenAllowed: 2000000,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-code-fast-1',
      label: 'Grok Code Fast 1',
      provider: 'xAI',
      maxTokenAllowed: 256000,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-4-fast-reasoning',
      label: 'Grok-4 Fast Reasoning',
      provider: 'xAI',
      maxTokenAllowed: 2000000,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-4-fast-non-reasoning',
      label: 'Grok-4 Fast Non-Reasoning',
      provider: 'xAI',
      maxTokenAllowed: 2000000,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-4-0709',
      label: 'Grok-4 0709',
      provider: 'xAI',
      maxTokenAllowed: 256000,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-3-mini',
      label: 'Grok-3 Mini',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },
    {
      name: 'grok-3',
      label: 'Grok-3',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
    },
    {
      name: 'grok-2-vision-1212',
      label: 'Grok-2 Vision 1212',
      provider: 'xAI',
      maxTokenAllowed: 32768,
      maxCompletionTokens: 8192,
    },
    {
      name: 'grok-2-1212',
      label: 'Grok-2 1212',
      provider: 'xAI',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
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
