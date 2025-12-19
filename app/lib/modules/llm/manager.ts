import type { IProviderSetting } from '~/types/model';
import { BaseProvider } from './base-provider';
import type { ModelInfo, ProviderInfo } from './types';
import * as providers from './registry';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LLMManager');

interface ErrorThrottleEntry {
  lastLogged: number;
  errorMessage: string;
}

export class LLMManager {
  private static _instance: LLMManager;
  private _providers: Map<string, BaseProvider> = new Map();
  private _modelList: ModelInfo[] = [];
  private readonly _env: any = {};
  private _errorThrottleCache: Map<string, ErrorThrottleEntry> = new Map();
  private readonly _errorThrottleMs = 5 * 60 * 1000; // 5 minutes

  private constructor(_env: Record<string, string>) {
    this._registerProvidersFromDirectory();
    this._env = _env;
  }

  static getInstance(env: Record<string, string> = {}): LLMManager {
    if (!LLMManager._instance) {
      LLMManager._instance = new LLMManager(env);
    }

    return LLMManager._instance;
  }
  get env() {
    return this._env;
  }

  private async _registerProvidersFromDirectory() {
    try {
      /*
       * Dynamically import all files from the providers directory
       * const providerModules = import.meta.glob('./providers/*.ts', { eager: true });
       */

      logger.debug('Starting provider registration...');

      const exportedItems = Object.values(providers);
      logger.debug(`Found ${exportedItems.length} exported items in registry`);

      let registeredCount = 0;

      // Look for exported classes that extend BaseProvider
      for (const exportedItem of exportedItems) {
        if (typeof exportedItem === 'function' && exportedItem.prototype instanceof BaseProvider) {
          const provider = new exportedItem();

          try {
            this.registerProvider(provider);
            registeredCount++;
          } catch (error: any) {
            logger.warn('Failed To Register Provider: ', provider.name, 'error:', error.message);
          }
        }
      }

      logger.info(`Successfully registered ${registeredCount} providers`);

      if (registeredCount === 0) {
        logger.error('WARNING: No providers were registered! This will cause model list to be empty.');
      }
    } catch (error) {
      logger.error('Error registering providers:', error);
    }
  }

  registerProvider(provider: BaseProvider) {
    if (this._providers.has(provider.name)) {
      logger.warn(`Provider ${provider.name} is already registered. Skipping.`);
      return;
    }

    logger.info('Registering Provider: ', provider.name);
    this._providers.set(provider.name, provider);
    this._modelList = [...this._modelList, ...provider.staticModels];
  }

  getProvider(name: string): BaseProvider | undefined {
    return this._providers.get(name);
  }

  getAllProviders(): BaseProvider[] {
    return Array.from(this._providers.values());
  }

  getModelList(): ModelInfo[] {
    return this._modelList;
  }

  private _shouldThrottleError(providerName: string, errorMessage: string): boolean {
    const now = Date.now();
    const cached = this._errorThrottleCache.get(`${providerName}:${errorMessage}`);

    if (cached && now - cached.lastLogged < this._errorThrottleMs) {
      return true; // Throttle this error
    }

    this._errorThrottleCache.set(`${providerName}:${errorMessage}`, { lastLogged: now, errorMessage });

    return false; // Log this error
  }

  private _hasRequiredConfiguration(
    provider: BaseProvider,
    apiKeys?: Record<string, string>,
    serverEnv?: Record<string, string>,
    providerSettings?: Record<string, IProviderSetting>,
  ): boolean {
    // Check if provider has API key configuration
    const config = provider.config;

    if (config?.apiTokenKey) {
      const hasApiKey = apiKeys?.[config.apiTokenKey] || serverEnv?.[config.apiTokenKey];

      if (!hasApiKey) {
        return false;
      }
    }

    // For local providers like Ollama and LMStudio, check if baseUrl is configured
    if (provider.name === 'Ollama' || provider.name === 'LMStudio') {
      const baseUrlKey = provider.name === 'Ollama' ? 'OLLAMA_API_BASE_URL' : 'LMSTUDIO_API_BASE_URL';
      const hasBaseUrl = providerSettings?.[provider.name]?.baseUrl || apiKeys?.[baseUrlKey] || serverEnv?.[baseUrlKey];

      if (!hasBaseUrl) {
        return false;
      }
    }

    return true;
  }

  private _logProviderError(providerName: string, error: any, context?: string): void {
    const errorMessage = error?.message || String(error);

    if (this._shouldThrottleError(providerName, errorMessage)) {
      logger.debug(`${providerName}: Error throttled (last logged recently): ${errorMessage}`);

      return;
    }

    // Classify error types for better messaging
    let logMessage = `Error getting dynamic models ${providerName}: ${errorMessage}`;

    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      logMessage = `${providerName}: Connection failed - service may not be running`;
    } else if (errorMessage.includes('Missing Api Key') || errorMessage.includes('No baseUrl found')) {
      logMessage = `${providerName}: Configuration error - ${errorMessage}`;
    } else if (errorMessage.includes('Unexpected API response')) {
      logMessage = `${providerName}: API response format error - ${errorMessage}`;
    }

    if (context) {
      logMessage += ` (${context})`;
    }

    logger.error(logMessage);
  }

  async updateModelList(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }): Promise<ModelInfo[]> {
    const { apiKeys, providerSettings, serverEnv } = options;

    logger.debug('updateModelList called', {
      hasApiKeys: !!apiKeys && Object.keys(apiKeys).length > 0,
      hasServerEnv: !!serverEnv && Object.keys(serverEnv).length > 0,
      registeredProviders: this._providers.size,
    });

    if (this._providers.size === 0) {
      logger.warn('No providers registered! Models will be empty.');
      return [];
    }

    let enabledProviders = Array.from(this._providers.values()).map((p) => p.name);

    if (providerSettings && Object.keys(providerSettings).length > 0) {
      enabledProviders = enabledProviders.filter((p) => providerSettings[p].enabled);
    }

    const staticModels = Array.from(this._providers.values()).flatMap((p) => p.staticModels || []);
    logger.debug(`Total static models available: ${staticModels.length}`);

    // Get dynamic models from all providers that support them
    const dynamicModels = await Promise.all(
      Array.from(this._providers.values())
        .filter((provider) => {
          if (!enabledProviders.includes(provider.name)) {
            logger.debug(`Skipping ${provider.name}: provider disabled`);
            return false;
          }

          return true;
        })
        .filter(
          (provider): provider is BaseProvider & Required<Pick<ProviderInfo, 'getDynamicModels'>> =>
            !!provider.getDynamicModels,
        )
        .map(async (provider) => {
          const cachedModels = provider.getModelsFromCache(options);

          if (cachedModels) {
            logger.debug(`Found ${cachedModels.length} cached models for ${provider.name}`);
            return cachedModels;
          }

          // Check if provider has required configuration before attempting fetch
          const providerConfig = providerSettings?.[provider.name];
          const hasRequiredConfig = this._hasRequiredConfiguration(provider, apiKeys, serverEnv, providerSettings);

          if (!hasRequiredConfig) {
            logger.debug(`Skipping ${provider.name}: missing required configuration`);
            return [];
          }

          const dynamicModels = await provider
            .getDynamicModels(apiKeys, providerConfig, serverEnv)
            .then((models) => {
              logger.info(`Caching ${models.length} dynamic models for ${provider.name}`);
              provider.storeDynamicModels(options, models);

              return models;
            })
            .catch((err) => {
              this._logProviderError(provider.name, err, 'dynamic models fetch');

              const providerStaticModels = provider.staticModels || [];

              if (providerStaticModels.length > 0) {
                logger.info(`${provider.name}: Falling back to ${providerStaticModels.length} static models`);
              }

              return [];
            });

          return dynamicModels;
        }),
    );

    const dynamicModelsFlat = dynamicModels.flat();
    const dynamicModelKeys = dynamicModelsFlat.map((d) => `${d.name}-${d.provider}`);
    const filteredStaticModels = staticModels.filter((m) => !dynamicModelKeys.includes(`${m.name}-${m.provider}`));

    logger.debug(
      `Dynamic models fetched: ${dynamicModelsFlat.length}, Static models to add: ${filteredStaticModels.length}`,
    );

    // Combine static and dynamic models
    const modelList = [...dynamicModelsFlat, ...filteredStaticModels];
    modelList.sort((a, b) => a.name.localeCompare(b.name));
    this._modelList = modelList;

    logger.info(`Total models available: ${modelList.length}`);

    return modelList;
  }
  getStaticModelList() {
    return [...this._providers.values()].flatMap((p) => p.staticModels || []);
  }
  async getModelListFromProvider(
    providerArg: BaseProvider,
    options: {
      apiKeys?: Record<string, string>;
      providerSettings?: Record<string, IProviderSetting>;
      serverEnv?: Record<string, string>;
    },
  ): Promise<ModelInfo[]> {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Provider ${providerArg.name} not found`);
    }

    const staticModels = provider.staticModels || [];

    if (!provider.getDynamicModels) {
      return staticModels;
    }

    const { apiKeys, providerSettings, serverEnv } = options;

    const cachedModels = provider.getModelsFromCache({
      apiKeys,
      providerSettings,
      serverEnv,
    });

    if (cachedModels) {
      logger.debug(`Found ${cachedModels.length} cached models for ${provider.name}`);

      return [...cachedModels, ...staticModels];
    }

    // Check if provider has required configuration before attempting fetch
    const hasRequiredConfig = this._hasRequiredConfiguration(provider, apiKeys, serverEnv);

    if (!hasRequiredConfig) {
      logger.debug(`Skipping ${provider.name}: missing required configuration`);
      return staticModels;
    }

    logger.debug(`Getting dynamic models for ${provider.name}`);

    const dynamicModels = await provider
      .getDynamicModels?.(apiKeys, providerSettings?.[provider.name], serverEnv)
      .then((models) => {
        logger.info(`Got ${models.length} dynamic models for ${provider.name}`);
        provider.storeDynamicModels(options, models);

        return models;
      })
      .catch((err) => {
        this._logProviderError(provider.name, err, 'dynamic models fetch');
        return [];
      });
    const dynamicModelsName = dynamicModels.map((d) => d.name);
    const filteredStaticList = staticModels.filter((m) => !dynamicModelsName.includes(m.name));
    const modelList = [...dynamicModels, ...filteredStaticList];
    modelList.sort((a, b) => a.name.localeCompare(b.name));

    return modelList;
  }
  getStaticModelListFromProvider(providerArg: BaseProvider) {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Provider ${providerArg.name} not found`);
    }

    return [...(provider.staticModels || [])];
  }

  getDefaultProvider(): BaseProvider {
    const firstProvider = this._providers.values().next().value;

    if (!firstProvider) {
      throw new Error('No providers registered');
    }

    return firstProvider;
  }
}
