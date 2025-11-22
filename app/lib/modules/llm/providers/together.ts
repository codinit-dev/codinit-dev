import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class TogetherProvider extends BaseProvider {
  name = 'Together';
  getApiKeyLink = 'https://api.together.xyz/settings/api-keys';
  icon = '/thirdparty/logos/togetherai.svg';

  config = {
    baseUrlKey: 'TOGETHER_API_BASE_URL',
    apiTokenKey: 'TOGETHER_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * DeepSeek-R1: 128k context, reasoning model with strong performance
     */
    {
      name: 'deepseek-ai/DeepSeek-R1',
      label: 'DeepSeek-R1',
      provider: 'Together',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
    },

    // Llama 4 Maverick: 128k context, SOTA 128-expert MoE
    {
      name: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
      label: 'Llama 4 Maverick',
      provider: 'Together',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },

    // Qwen3 235B: 256k context, large MoE model
    {
      name: 'Qwen/Qwen3-235B-A22B-Instruct-2507-FP8',
      label: 'Qwen3 235B',
      provider: 'Together',
      maxTokenAllowed: 262144,
      maxCompletionTokens: 16384,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl: fetchBaseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'TOGETHER_API_BASE_URL',
      defaultApiTokenKey: 'TOGETHER_API_KEY',
    });
    const baseUrl = fetchBaseUrl || 'https://api.together.xyz/v1';

    if (!baseUrl || !apiKey) {
      return [];
    }

    // console.log({ baseUrl, apiKey });

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const res = (await response.json()) as any;
    const data = (res || []).filter((model: any) => model.type === 'chat');

    return data.map((m: any) => ({
      name: m.id,
      label: `${m.display_name} - in:$${m.pricing.input.toFixed(2)} out:$${m.pricing.output.toFixed(2)} - context ${Math.floor(m.context_length / 1000)}k`,
      provider: this.name,
      maxTokenAllowed: Math.min(m.context_length || 8192, 262144),
      maxCompletionTokens: 8192,
    }));
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'TOGETHER_API_BASE_URL',
      defaultApiTokenKey: 'TOGETHER_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
}
