import { describe, it, expect, beforeEach } from 'vitest';
import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

class TestProvider extends BaseProvider {
  name = 'TestProvider';
  getApiKeyLink = 'https://test.com/api-keys';
  labelForGetApiKey = 'Get Test API Key';
  icon = '/test-icon.svg';

  config = {
    apiTokenKey: 'TEST_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'test-model-1',
      label: 'Test Model 1',
      provider: 'TestProvider',
      maxTokenAllowed: 1000,
      maxCompletionTokens: 500,
    },
  ];

  async getDynamicModels(
    apiKeys: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    if (!apiKeys[this.config.apiTokenKey]) {
      return [];
    }

    return [
      {
        name: 'test-dynamic-model',
        label: 'Test Dynamic Model',
        provider: 'TestProvider',
        maxTokenAllowed: 2000,
        maxCompletionTokens: 1000,
      },
    ];
  }

  getModelInstance(_options: {
    model: string;
    serverEnv?: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    // Mock implementation for testing
    return {} as LanguageModelV1;
  }
}

describe('BaseProvider', () => {
  let provider: TestProvider;

  beforeEach(() => {
    provider = new TestProvider();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider.name).toBe('TestProvider');
      expect(provider.getApiKeyLink).toBe('https://test.com/api-keys');
      expect(provider.labelForGetApiKey).toBe('Get Test API Key');
      expect(provider.icon).toBe('/test-icon.svg');
      expect(provider.staticModels).toHaveLength(1);
    });
  });

  describe('getModelsFromCache', () => {
    it('should return undefined when no cache exists', () => {
      const options = {
        apiKeys: { TEST_API_KEY: 'test-key' },
        providerSettings: {},
        serverEnv: {},
      };

      const result = provider.getModelsFromCache(options);
      expect(result).toBeUndefined();
    });

    it('should return cached models when available', () => {
      const options = {
        apiKeys: { TEST_API_KEY: 'test-key' },
        providerSettings: {},
        serverEnv: {},
      };

      const testModels: ModelInfo[] = [
        {
          name: 'cached-model',
          label: 'Cached Model',
          provider: 'TestProvider',
          maxTokenAllowed: 1000,
          maxCompletionTokens: 500,
        },
      ];

      // Manually set cache
      provider.storeDynamicModels(options, testModels);

      const result = provider.getModelsFromCache(options);
      expect(result).toEqual(testModels);
    });
  });

  describe('storeDynamicModels', () => {
    it('should store models in cache', () => {
      const options = {
        apiKeys: { TEST_API_KEY: 'test-key' },
        providerSettings: {},
        serverEnv: {},
      };

      const testModels: ModelInfo[] = [
        {
          name: 'test-model',
          label: 'Test Model',
          provider: 'TestProvider',
          maxTokenAllowed: 1000,
          maxCompletionTokens: 500,
        },
      ];

      provider.storeDynamicModels(options, testModels);

      const cached = provider.getModelsFromCache(options);
      expect(cached).toEqual(testModels);
    });
  });

  describe('getDynamicModels', () => {
    it('should return dynamic models when API key is available', async () => {
      const apiKeys = { TEST_API_KEY: 'test-key' };
      const settings = {};
      const serverEnv = {};

      const models = await provider.getDynamicModels(apiKeys, settings, serverEnv);

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('test-dynamic-model');
      expect(models[0].provider).toBe('TestProvider');
    });

    it('should return empty array when API key is not available', async () => {
      const apiKeys = {};
      const settings = {};
      const serverEnv = {};

      const models = await provider.getDynamicModels(apiKeys, settings, serverEnv);

      expect(models).toEqual([]);
    });
  });

  describe('cache key generation', () => {
    it('should invalidate cache when options change', () => {
      const options1 = {
        apiKeys: { TEST_API_KEY: 'key1' },
        providerSettings: {},
        serverEnv: {},
      };

      const options2 = {
        apiKeys: { TEST_API_KEY: 'key2' },
        providerSettings: {},
        serverEnv: {},
      };

      // Store models with options1
      provider.storeDynamicModels(options1, [
        { name: 'model1', label: 'Model 1', provider: 'TestProvider', maxTokenAllowed: 1000, maxCompletionTokens: 500 },
      ]);

      // Should return cached models for options1
      const cached1 = provider.getModelsFromCache(options1);
      expect(cached1?.[0].name).toBe('model1');

      // Should return undefined for options2 (different cache key)
      const cached2 = provider.getModelsFromCache(options2);
      expect(cached2).toBeUndefined();
    });
  });
});
