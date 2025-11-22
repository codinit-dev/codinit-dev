import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

export default class DeepseekProvider extends BaseProvider {
  name = 'Deepseek';
  getApiKeyLink = 'https://platform.deepseek.com/apiKeys';
  icon = '/thirdparty/logos/deepseek.svg';

  config = {
    apiTokenKey: 'DEEPSEEK_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * DeepSeek-R1: 128k context, reasoning model
     */
    {
      name: 'deepseek-reasoner',
      label: 'DeepSeek-R1',
      provider: 'Deepseek',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
    },

    // DeepSeek-V3: 128k context, chat model
    {
      name: 'deepseek-chat',
      label: 'DeepSeek-V3',
      provider: 'Deepseek',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },

    // DeepSeek-Coder-V2: 128k context, coding model
    {
      name: 'deepseek-coder',
      label: 'DeepSeek-Coder-V2',
      provider: 'Deepseek',
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
      defaultApiTokenKey: 'DEEPSEEK_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const deepseek = createDeepSeek({
      apiKey,
    });

    return deepseek(model, {
      // simulateStreaming: true,
    });
  }
}
