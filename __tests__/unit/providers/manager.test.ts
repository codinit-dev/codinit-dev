import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMManager } from '~/lib/modules/llm/manager';
import { mockOpenAIModels, mockApiKeys } from '../../fixtures/api-responses';

describe('LLMManager', () => {
  let manager: LLMManager;

  beforeEach(() => {
    // Reset the singleton instance for each test
    (LLMManager as any)._instance = null;
    manager = LLMManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = LLMManager.getInstance();
      const instance2 = LLMManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAllProviders', () => {
    it('should return all registered providers', () => {
      const providers = manager.getAllProviders();
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);

      // Check that providers have required properties
      providers.forEach((provider) => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('staticModels');
        expect(typeof provider.name).toBe('string');
        expect(Array.isArray(provider.staticModels)).toBe(true);
      });
    });
  });

  describe('getProvider', () => {
    it('should return a provider by name', () => {
      const provider = manager.getProvider('OpenAI');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('OpenAI');
    });

    it('should return undefined for non-existent provider', () => {
      const provider = manager.getProvider('NonExistentProvider');
      expect(provider).toBeUndefined();
    });
  });

  describe('getDefaultProvider', () => {
    it('should return a default provider', () => {
      const provider = manager.getDefaultProvider();
      expect(provider).toBeDefined();
      expect(provider.name).toBeDefined();
    });
  });

  describe('getStaticModelList', () => {
    it('should return all static models from all providers', () => {
      const models = manager.getStaticModelList();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);

      // Check model structure
      models.forEach((model) => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('label');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('maxTokenAllowed');
      });
    });
  });

  describe('updateModelList', () => {
    it('should update model list with API keys', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Mock successful API responses for providers
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockOpenAIModels.data }),
      });

      const options = {
        apiKeys: mockApiKeys,
        providerSettings: {},
        serverEnv: {},
      };

      const models = await manager.updateModelList(options);

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should handle provider errors gracefully', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Mock failed API response
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const options = {
        apiKeys: mockApiKeys,
        providerSettings: {},
        serverEnv: {},
      };

      const models = await manager.updateModelList(options);

      // Should still return static models even if dynamic fetch fails
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('getModelListFromProvider', () => {
    it('should return models for a specific provider', async () => {
      const provider = manager.getProvider('OpenAI');
      expect(provider).toBeDefined();

      if (provider) {
        const mockFetch = vi.fn();
        global.fetch = mockFetch;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockOpenAIModels.data }),
        });

        const options = {
          apiKeys: mockApiKeys,
          providerSettings: {},
          serverEnv: {},
        };

        const models = await manager.getModelListFromProvider(provider, options);

        expect(Array.isArray(models)).toBe(true);
        models.forEach((model) => {
          expect(model.provider).toBe('OpenAI');
        });
      }
    });

    it('should return static models when API call fails', async () => {
      const provider = manager.getProvider('OpenAI');
      expect(provider).toBeDefined();

      if (provider) {
        const mockFetch = vi.fn();
        global.fetch = mockFetch;

        mockFetch.mockRejectedValueOnce(new Error('API Error'));

        const options = {
          apiKeys: {},
          providerSettings: {},
          serverEnv: {},
        };

        const models = await manager.getModelListFromProvider(provider, options);

        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBeGreaterThan(0);

        // Should return static models
        models.forEach((model) => {
          expect(model.provider).toBe('OpenAI');
        });
      }
    });
  });
});
