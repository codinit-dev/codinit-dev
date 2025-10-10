import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAnthropic } from '@ai-sdk/anthropic';

export default class AnthropicProvider extends BaseProvider {
  name = 'Anthropic';
  getApiKeyLink = 'https://console.anthropic.com/settings/keys';
  icon = '/thirdparty/logos/anthropic.svg';

  config = {
    apiTokenKey: 'ANTHROPIC_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // Claude 4 Family - Latest models with extended thinking support
    {
      name: 'claude-sonnet-4-5-20250929',
      label: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      maxTokenAllowed: 64000,
    },
    {
      name: 'claude-opus-4-1-20250805',
      label: 'Claude Opus 4.1',
      provider: 'Anthropic',
      maxTokenAllowed: 32000,
    },
    {
      name: 'claude-sonnet-4-20250514',
      label: 'Claude Sonnet 4',
      provider: 'Anthropic',
      maxTokenAllowed: 32000,
    },

    // Claude 3.7 Family - Extended thinking support
    {
      name: 'claude-3-7-sonnet-20250219',
      label: 'Claude 3.7 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 32000,
    },

    // Claude 3.5 Family
    {
      name: 'claude-3-5-haiku-20241022',
      label: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      maxTokenAllowed: 8192,
    },
    {
      name: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet (latest)',
      provider: 'Anthropic',
      maxTokenAllowed: 8192,
    },
    {
      name: 'claude-3-5-sonnet-20240620',
      label: 'Claude 3.5 Sonnet (June)',
      provider: 'Anthropic',
      maxTokenAllowed: 8192,
    },

    // Claude 3 Family - Legacy models
    {
      name: 'claude-3-opus-20240229',
      label: 'Claude 3 Opus',
      provider: 'Anthropic',
      maxTokenAllowed: 4096,
    },
    {
      name: 'claude-3-sonnet-20240229',
      label: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 4096,
    },
    {
      name: 'claude-3-haiku-20240307',
      label: 'Claude 3 Haiku',
      provider: 'Anthropic',
      maxTokenAllowed: 4096,
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
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    const response = await fetch(`https://api.anthropic.com/v1/models`, {
      headers: {
        'x-api-key': `${apiKey}`,
        'anthropic-version': '2023-06-01',
      },
    });

    const res = (await response.json()) as any;
    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter((model: any) => model.type === 'model' && !staticModelIds.includes(model.id));

    return data.map((m: any) => ({
      name: m.id,
      label: `${m.display_name}`,
      provider: this.name,
      maxTokenAllowed: 32000,
    }));
  }

  getModelInstance: (options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });
    const anthropic = createAnthropic({
      apiKey,
    });

    return anthropic(model);
  };
}
