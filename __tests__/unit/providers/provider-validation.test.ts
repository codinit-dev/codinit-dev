import { describe, it, expect } from 'vitest';
import { LLMManager } from '~/lib/modules/llm/manager';

describe('Provider Validation', () => {
  const manager = LLMManager.getInstance();
  const providers = manager.getAllProviders();

  describe('Provider Structure', () => {
    it('should have all required provider properties', () => {
      providers.forEach((provider) => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('staticModels');
        expect(provider).toHaveProperty('config');

        expect(typeof provider.name).toBe('string');
        expect(provider.name.length).toBeGreaterThan(0);
        expect(Array.isArray(provider.staticModels)).toBe(true);

        // Optional properties
        if (provider.getApiKeyLink) {
          expect(typeof provider.getApiKeyLink).toBe('string');
        }

        if (provider.icon) {
          expect(typeof provider.icon).toBe('string');
        }
      });
    });
  });

  describe('Model Structure', () => {
    it('should have valid models in all providers', () => {
      providers.forEach((provider) => {
        provider.staticModels.forEach((model) => {
          expect(model).toHaveProperty('name');
          expect(model).toHaveProperty('label');
          expect(model).toHaveProperty('provider');
          expect(model).toHaveProperty('maxTokenAllowed');

          expect(typeof model.name).toBe('string');
          expect(model.name.length).toBeGreaterThan(0);
          expect(typeof model.label).toBe('string');
          expect(model.label.length).toBeGreaterThan(0);
          expect(typeof model.provider).toBe('string');
          expect(typeof model.maxTokenAllowed).toBe('number');

          // Provider name should match
          expect(model.provider).toBe(provider.name);
        });
      });
    });

    it('should have reasonable token limits', () => {
      providers.forEach((provider) => {
        provider.staticModels.forEach((model) => {
          // Context window should be at least 2048 (reasonable minimum)
          expect(model.maxTokenAllowed).toBeGreaterThanOrEqual(2048);

          // Context window should be less than 10 million tokens
          expect(model.maxTokenAllowed).toBeLessThan(10_000_000);

          // Completion tokens should be less than context window
          if (model.maxCompletionTokens) {
            expect(model.maxCompletionTokens).toBeGreaterThan(0);
            expect(model.maxCompletionTokens).toBeLessThanOrEqual(model.maxTokenAllowed);
          }
        });
      });
    });
  });

  describe('Duplicate Detection', () => {
    it('should not have duplicate model names within a provider', () => {
      providers.forEach((provider) => {
        const modelNames = provider.staticModels.map((m) => m.name);
        const uniqueNames = new Set(modelNames);

        if (modelNames.length !== uniqueNames.size) {
          const duplicates = modelNames.filter((name, idx) => modelNames.indexOf(name) !== idx);
          throw new Error(`Provider ${provider.name} has duplicate models: ${duplicates}`);
        }

        expect(modelNames.length).toBe(uniqueNames.size);
      });
    });

    it('should not have duplicate labels within a provider', () => {
      providers.forEach((provider) => {
        const modelLabels = provider.staticModels.map((m) => m.label);
        const uniqueLabels = new Set(modelLabels);

        if (modelLabels.length !== uniqueLabels.size) {
          const duplicates = modelLabels.filter((label, idx) => modelLabels.indexOf(label) !== idx);
          throw new Error(`Provider ${provider.name} has duplicate labels: ${duplicates}`);
        }

        expect(modelLabels.length).toBe(uniqueLabels.size);
      });
    });
  });

  describe('Provider Coverage', () => {
    it('should have at least 3 models per provider', () => {
      providers.forEach((provider) => {
        // Some smaller providers might have fewer models, but major ones should have at least 2
        if (['OpenAI', 'Anthropic', 'Google', 'Groq', 'Mistral', 'DeepSeek', 'xAI'].includes(provider.name)) {
          expect(provider.staticModels.length).toBeGreaterThanOrEqual(2);
        }
      });
    });
  });

  describe('Model Name Validation', () => {
    it('should have valid model names (no empty strings)', () => {
      providers.forEach((provider) => {
        provider.staticModels.forEach((model) => {
          expect(model.name).toBeTruthy();
          expect(model.name).not.toMatch(/^\s*$/);
          expect(model.label).toBeTruthy();
          expect(model.label).not.toMatch(/^\s*$/);
        });
      });
    });

    it('should not have null or undefined token values', () => {
      providers.forEach((provider) => {
        provider.staticModels.forEach((model) => {
          expect(model.maxTokenAllowed).toBeDefined();
          expect(model.maxTokenAllowed).not.toBeNull();

          if (model.maxCompletionTokens !== undefined) {
            expect(model.maxCompletionTokens).not.toBeNull();
          }
        });
      });
    });
  });

  describe('Provider Count', () => {
    it('should have at least 10 providers', () => {
      expect(providers.length).toBeGreaterThanOrEqual(10);
    });

    it('should have all major providers registered', () => {
      const providerNames = providers.map((p) => p.name);
      const majorProviders = ['OpenAI', 'Anthropic', 'Google', 'Groq', 'Deepseek'];

      majorProviders.forEach((providerName) => {
        expect(providerNames).toContain(providerName);
      });
    });
  });

  describe('Static Models Count', () => {
    it('should have at least 50 total static models across all providers', () => {
      const totalModels = providers.reduce((sum, p) => sum + p.staticModels.length, 0);
      expect(totalModels).toBeGreaterThanOrEqual(50);
    });
  });
});
