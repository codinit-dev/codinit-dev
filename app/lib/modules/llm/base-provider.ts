import type { LanguageModelV1 } from 'ai';
import type { ProviderInfo, ProviderConfig, ModelInfo } from './types';
import type { IProviderSetting } from '~/types/model';
import { createOpenAI } from '@ai-sdk/openai';
import { LLMManager } from './manager';
import { saveModelsToCache, loadModelsFromCache } from '~/lib/persistence/modelCache';

export abstract class BaseProvider implements ProviderInfo {
  abstract name: string;
  abstract staticModels: ModelInfo[];
  abstract config: ProviderConfig;
  cachedDynamicModels?: {
    cacheId: string;
    models: ModelInfo[];
  };

  getApiKeyLink?: string;
  labelForGetApiKey?: string;
  icon?: string;

  getProviderBaseUrlAndKey(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: IProviderSetting;
    serverEnv?: Record<string, string>;
    defaultBaseUrlKey: string;
    defaultApiTokenKey: string;
  }) {
    const { apiKeys, providerSettings, serverEnv, defaultBaseUrlKey, defaultApiTokenKey } = options;
    let settingsBaseUrl = providerSettings?.baseUrl;
    const manager = LLMManager.getInstance();

    if (settingsBaseUrl && settingsBaseUrl.length == 0) {
      settingsBaseUrl = undefined;
    }

    const baseUrlKey = this.config.baseUrlKey || defaultBaseUrlKey;

    /*
     * Priority order for baseUrl:
     * 1. User settings (UI)
     * 2. process.env (Node.js/Electron environment)
     * 3. serverEnv (Cloudflare/server environment)
     * 4. manager.env (passed at initialization)
     * 5. Config defaults
     *
     * In Electron, process.env is prioritized over serverEnv for better compatibility
     */
    let baseUrl =
      settingsBaseUrl ||
      (typeof process !== 'undefined' && process?.env?.[baseUrlKey]) ||
      serverEnv?.[baseUrlKey] ||
      manager.env?.[baseUrlKey] ||
      this.config.baseUrl;

    if (baseUrl && baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const apiTokenKey = this.config.apiTokenKey || defaultApiTokenKey;

    /*
     * Priority order for API key:
     * 1. Cookies (user input in UI)
     * 2. process.env (Node.js/Electron environment)
     * 3. serverEnv (Cloudflare/server environment)
     * 4. manager.env (passed at initialization)
     *
     * In Electron, process.env is prioritized for better compatibility
     */
    const apiKey =
      apiKeys?.[this.name] ||
      (typeof process !== 'undefined' && process?.env?.[apiTokenKey]) ||
      serverEnv?.[apiTokenKey] ||
      manager.env?.[apiTokenKey];

    return {
      baseUrl,
      apiKey,
    };
  }
  getModelsFromCache(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }): ModelInfo[] | null {
    const generatedCacheKey = this.getDynamicModelsCacheKey(options);

    // First, try loading from persistent storage (localStorage)
    const persistedModels = loadModelsFromCache(this.name, generatedCacheKey);

    if (persistedModels && persistedModels.length > 0) {
      // Update in-memory cache with persisted data
      this.cachedDynamicModels = {
        cacheId: generatedCacheKey,
        models: persistedModels,
      };
      return persistedModels;
    }

    // Fall back to in-memory cache
    if (!this.cachedDynamicModels) {
      return null;
    }

    const cacheKey = this.cachedDynamicModels.cacheId;

    if (cacheKey !== generatedCacheKey) {
      this.cachedDynamicModels = undefined;
      return null;
    }

    return this.cachedDynamicModels.models;
  }
  getDynamicModelsCacheKey(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }) {
    return JSON.stringify({
      apiKeys: options.apiKeys?.[this.name],
      providerSettings: options.providerSettings?.[this.name],
      serverEnv: options.serverEnv,
    });
  }
  storeDynamicModels(
    options: {
      apiKeys?: Record<string, string>;
      providerSettings?: Record<string, IProviderSetting>;
      serverEnv?: Record<string, string>;
    },
    models: ModelInfo[],
  ) {
    const cacheId = this.getDynamicModelsCacheKey(options);

    // Store in memory
    this.cachedDynamicModels = {
      cacheId,
      models,
    };

    // Persist to localStorage
    saveModelsToCache(this.name, cacheId, models);
  }

  // Declare the optional getDynamicModels method
  getDynamicModels?(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]>;

  abstract getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1;
}

type OptionalApiKey = string | undefined;

export function getOpenAILikeModel(baseURL: string, apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  return openai(model);
}
