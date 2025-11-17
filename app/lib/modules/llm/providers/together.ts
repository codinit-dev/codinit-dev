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
     * Llama 3.2 90B Vision: 128k context, multimodal capabilities
     */
    {
      name: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      label: 'Llama 3.2 90B Vision',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Mixtral 8x7B: 32k context, strong performance
    {
      name: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      label: 'Mixtral 8x7B Instruct',
      provider: 'Together',
      maxTokenAllowed: 32000,
      maxCompletionTokens: 8192,
    },

    // Llama 3.1 70B
    {
      name: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      label: 'Llama 3.1 70B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Kimi K2 Thinking: 1T parameter MoE thinking agent, 256K context
    {
      name: 'moonshotai/Kimi-K2-Thinking',
      label: 'Kimi K2 Thinking',
      provider: 'Together',
      maxTokenAllowed: 256000,
      maxCompletionTokens: 32768,
    },

    // Gemma 3 27B: Lightweight model with vision-language input
    {
      name: 'google/gemma-3-27b-it',
      label: 'Gemma 3 27B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Qwen3-Coder 480B A35B Instruct: 480B MoE coding model, 256K context
    {
      name: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
      label: 'Qwen3-Coder 480B A35B Instruct',
      provider: 'Together',
      maxTokenAllowed: 256000,
      maxCompletionTokens: 32768,
    },

    // DeepSeek-V3.2-Exp: 685B parameter experimental model, 128K context
    {
      name: 'deepseek-ai/DeepSeek-V3.2-Exp',
      label: 'DeepSeek-V3.2-Exp',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Gemma 3n E4B Instruct: Selective parameter activation, multimodal
    {
      name: 'google/gemma-3n-4b-it',
      label: 'Gemma 3n E4B Instruct',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Arcee AI Coder-Large: 32B Qwen-2.5-32B-Instruct based
    {
      name: 'arcee-ai/Arcee-Coder-Large',
      label: 'Arcee AI Coder-Large',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Devstral Small 2505: 24B coding model
    {
      name: 'mistralai/Devstral-Small-2505',
      label: 'Devstral Small 2505',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Magistral Small 2506: 24B reasoning model
    {
      name: 'mistralai/Magistral-Small-2506',
      label: 'Magistral Small 2506',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Cogito V1 Preview Llama 70B: Best-in-class open-source LLM
    {
      name: 'cognitivecomputations/CogitoV1Preview-Llama-70B',
      label: 'Cogito V1 Preview Llama 70B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Cogito V1 Preview Qwen 32B: Best-in-class open-source LLM
    {
      name: 'cognitivecomputations/CogitoV1Preview-Qwen-32B',
      label: 'Cogito V1 Preview Qwen 32B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Cogito V1 Preview Qwen 14B: Best-in-class open-source LLM
    {
      name: 'cognitivecomputations/CogitoV1Preview-Qwen-14B',
      label: 'Cogito V1 Preview Qwen 14B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Gemma 3 12B: Lightweight model with vision-language input
    {
      name: 'google/gemma-3-12b-it',
      label: 'Gemma 3 12B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Cogito V1 Preview Llama 3B: Best-in-class open-source LLM
    {
      name: 'cognitivecomputations/CogitoV1Preview-Llama-3B',
      label: 'Cogito V1 Preview Llama 3B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Gemma 3 1B: Most lightweight Gemma 3 model, 128K context
    {
      name: 'google/gemma-3-1b-it',
      label: 'Gemma 3 1B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // Gemma 3 4B: Lightweight model with vision-language input
    {
      name: 'google/gemma-3-4b-it',
      label: 'Gemma 3 4B',
      provider: 'Together',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
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
      maxTokenAllowed: 8000,
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
