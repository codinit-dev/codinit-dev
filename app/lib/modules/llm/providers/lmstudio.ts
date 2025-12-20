import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV1 } from 'ai';
import { logger } from '~/utils/logger';

export default class LMStudioProvider extends BaseProvider {
  name = 'LMStudio';
  getApiKeyLink = 'https://lmstudio.ai/';
  labelForGetApiKey = 'Get LMStudio';
  icon = '/thirdparty/logos/lmstudio.svg';

  config = {
    baseUrlKey: 'LMSTUDIO_API_BASE_URL',
    baseUrl: 'http://localhost:1234/',
  };

  staticModels: ModelInfo[] = [];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'LMSTUDIO_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    if (!baseUrl) {
      throw new Error('No baseUrl found for LMStudio provider');
    }

    if (typeof window === 'undefined') {
      /*
       * Running in Server
       * Backend: Check if we're running in Docker
       */
      const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || serverEnv?.RUNNING_IN_DOCKER === 'true';

      if (isDocker) {
        try {
          const url = new URL(baseUrl);

          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            url.hostname = 'host.docker.internal';
            baseUrl = url.toString().replace(/\/$/, '');
          }
        } catch (error) {
          logger.warn('Failed to parse LMStudio baseUrl for Docker mapping:', error);
        }
      }
    }

    const response = await fetch(`${baseUrl}/v1/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch LMStudio models: HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { data: Array<{ id: string }> };

    if (!data || !Array.isArray(data.data)) {
      throw new Error('Invalid response from LMStudio API: missing data array');
    }

    return data.data.map((model) => ({
      name: model.id,
      label: model.id,
      provider: this.name,
      maxTokenAllowed: 8000,
      maxCompletionTokens: 8000,
    }));
  }
  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'LMSTUDIO_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    if (!baseUrl) {
      throw new Error('No baseUrl found for LMStudio provider');
    }

    const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || serverEnv?.RUNNING_IN_DOCKER === 'true';

    if (typeof window === 'undefined' && isDocker) {
      try {
        const url = new URL(baseUrl);

        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          url.hostname = 'host.docker.internal';
          baseUrl = url.toString().replace(/\/$/, '');
        }
      } catch (error) {
        logger.warn('Failed to parse LMStudio baseUrl for Docker mapping:', error);
      }
    }

    logger.debug('LMStudio Base Url used: ', baseUrl);

    const lmstudio = createOpenAI({
      baseURL: `${baseUrl}/v1`,
      apiKey: '',
    });

    return lmstudio(model);
  };
}
