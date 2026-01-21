import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { logger } from '~/utils/logger';

interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaApiResponse {
  models: OllamaModel[];
}

export default class OllamaProvider extends BaseProvider {
  name = 'Ollama';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama';
  icon = '/thirdparty/logos/ollama.svg';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
  };

  staticModels: ModelInfo[] = [];

  private _convertEnvToRecord(env?: Env): Record<string, string> {
    if (!env) {
      return {};
    }

    // Convert Env to a plain object with string values
    return Object.entries(env).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  getDefaultNumCtx(serverEnv?: Env): number {
    const envRecord = this._convertEnvToRecord(serverEnv);
    return envRecord.DEFAULT_NUM_CTX ? parseInt(envRecord.DEFAULT_NUM_CTX, 10) : 32768;
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    if (!baseUrl) {
      throw new Error('No baseUrl found for OLLAMA provider');
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
          logger.warn('Failed to parse Ollama baseUrl for Docker mapping:', error);
        }
      }
    }

    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Ollama models: HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaApiResponse;

    if (!data || !Array.isArray(data.models)) {
      throw new Error('Invalid response from Ollama API: missing models array');
    }

    return data.models.map((model: OllamaModel) => {
      // Use proper context window based on model family and parameter size
      let contextWindow = 4096; // default

      // Larger context windows for modern models
      if (model.details?.parameter_size) {
        const paramSize = parseInt(model.details.parameter_size.replace(/[^0-9]/g, ''));

        // Models with larger parameter sizes generally support larger contexts
        if (paramSize >= 70) {
          contextWindow = 32768; // 32k for 70B+ models
        } else if (paramSize >= 30) {
          contextWindow = 16384; // 16k for 30B+ models
        } else if (paramSize >= 7) {
          contextWindow = 8192; // 8k for 7B+ models
        }
      }

      // Special handling for specific model families
      if (model.details?.family?.includes('llama') && model.details?.parameter_size?.includes('70')) {
        contextWindow = 32768; // Llama 70B models
      } else if (model.details?.family?.includes('llama') && model.details?.parameter_size?.includes('405')) {
        contextWindow = 128000; // Llama 405B models
      }

      return {
        name: model.name,
        label: `${model.name} (${model.details?.parameter_size || 'unknown'}, ${contextWindow >= 1000 ? Math.floor(contextWindow / 1000) + 'k' : contextWindow} ctx)`,
        provider: this.name,
        maxTokenAllowed: contextWindow,
        maxCompletionTokens: Math.min(contextWindow, 4096), // Cap completion tokens
        icon: '/thirdparty/logos/ollama.svg',
      };
    });
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const envRecord = this._convertEnvToRecord(serverEnv);

    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    if (!baseUrl) {
      throw new Error('No baseUrl found for OLLAMA provider');
    }

    // Backend: Check if we're running in Docker
    const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || envRecord.RUNNING_IN_DOCKER === 'true';

    if (isDocker) {
      try {
        const url = new URL(baseUrl);

        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          url.hostname = 'host.docker.internal';
          baseUrl = url.toString().replace(/\/$/, '');
        }
      } catch (error) {
        logger.warn('Failed to parse Ollama baseUrl for Docker mapping:', error);
      }
    }

    logger.debug('Ollama Base Url used: ', baseUrl);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
    }) as LanguageModelV1 & { config: any };

    ollamaInstance.config.baseURL = `${baseUrl}/api`;

    return ollamaInstance;
  };
}
