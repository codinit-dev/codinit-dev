import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class GroqProvider extends BaseProvider {
  name = 'Groq';
  getApiKeyLink = 'https://console.groq.com/keys';
  icon = '/thirdparty/logos/groq.svg';

  config = {
    apiTokenKey: 'GROQ_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Production Models - stable and reliable for production use
     * Llama 3.1 8B: 128k context, fast and efficient
     */
    {
      name: 'llama-3.1-8b-instant',
      label: 'Llama 3.1 8B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 131072,
    },

    // Llama 3.3 70B: 128k context, most capable model
    {
      name: 'llama-3.3-70b-versatile',
      label: 'Llama 3.3 70B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 32768,
    },

    // Llama Guard 4 12B: Safety model for content moderation
    {
      name: 'meta-llama/llama-guard-4-12b',
      label: 'Llama Guard 4 12B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 1024,
    },

    // GPT OSS 120B: OpenAI's flagship open-weight model
    {
      name: 'openai/gpt-oss-120b',
      label: 'GPT OSS 120B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 65536,
    },

    // GPT OSS 20B: Smaller, faster GPT model
    {
      name: 'openai/gpt-oss-20b',
      label: 'GPT OSS 20B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 65536,
    },

    // Qwen3 32B: Alibaba Cloud's advanced model
    {
      name: 'qwen/qwen3-32b',
      label: 'Qwen3 32B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 40960,
    },

    /*
     * Production Systems - AI systems with built-in tools
     */
    // Groq Compound: AI system with web search and code execution
    {
      name: 'groq/compound',
      label: 'Groq Compound',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },

    // Groq Compound Mini: Lightweight version of Compound
    {
      name: 'groq/compound-mini',
      label: 'Groq Compound Mini',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },

    /*
     * Preview Models - for evaluation purposes only
     */
    // Llama 4 Maverick 17B: Advanced Llama 4 model
    {
      name: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      label: 'Llama 4 Maverick 17B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },

    // Llama 4 Scout 17B: Efficient Llama 4 model
    {
      name: 'meta-llama/llama-4-scout-17b-16e-instruct',
      label: 'Llama 4 Scout 17B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 8192,
    },

    // Llama Prompt Guard 2 22M: Lightweight safety model
    {
      name: 'meta-llama/llama-prompt-guard-2-22m',
      label: 'Llama Prompt Guard 2 22M',
      provider: 'Groq',
      maxTokenAllowed: 512,
      maxCompletionTokens: 512,
    },

    // Prompt Guard 2 86M: Advanced safety model
    {
      name: 'meta-llama/llama-prompt-guard-2-86m',
      label: 'Prompt Guard 2 86M',
      provider: 'Groq',
      maxTokenAllowed: 512,
      maxCompletionTokens: 512,
    },

    // Kimi K2 Instruct 0905: Updated Kimi model
    {
      name: 'moonshotai/kimi-k2-instruct-0905',
      label: 'Kimi K2 Instruct 0905',
      provider: 'Groq',
      maxTokenAllowed: 262144,
      maxCompletionTokens: 16384,
    },

    // Kimi K2 Instruct (original)
    {
      name: 'moonshotai/kimi-k2-instruct',
      label: 'Kimi K2 Instruct',
      provider: 'Groq',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // GPT OSS Safeguard 20B: Safety-focused GPT model
    {
      name: 'openai/gpt-oss-safeguard-20b',
      label: 'GPT OSS Safeguard 20B',
      provider: 'Groq',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 65536,
    },

    /*
     * Audio Models - Speech to Text and Text to Speech
     */
    // Whisper Large V3: Speech to text
    {
      name: 'whisper-large-v3',
      label: 'Whisper Large V3',
      provider: 'Groq',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4096,
    },

    // Whisper Large V3 Turbo: Faster speech to text
    {
      name: 'whisper-large-v3-turbo',
      label: 'Whisper Large V3 Turbo',
      provider: 'Groq',
      maxTokenAllowed: 4096,
      maxCompletionTokens: 4096,
    },

    // PlayAI TTS: Text to speech
    {
      name: 'playai-tts',
      label: 'PlayAI TTS',
      provider: 'Groq',
      maxTokenAllowed: 8192,
      maxCompletionTokens: 8192,
    },

    // PlayAI TTS Arabic: Arabic text to speech
    {
      name: 'playai-tts-arabic',
      label: 'PlayAI TTS Arabic',
      provider: 'Groq',
      maxTokenAllowed: 8192,
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
      defaultApiTokenKey: 'GROQ_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    const response = await fetch(`https://api.groq.com/openai/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const res = (await response.json()) as any;

    const data = res.data.filter(
      (model: any) => model.object === 'model' && model.active && model.context_window > 8000,
    );

    return data.map((m: any) => ({
      name: m.id,
      label: `${m.id} - context ${m.context_window ? Math.floor(m.context_window / 1000) + 'k' : 'N/A'} [ by ${m.owned_by}]`,
      provider: this.name,
      maxTokenAllowed: Math.min(m.context_window || 8192, 16384),
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

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GROQ_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
    });

    return openai(model);
  }
}
