import { createScopedLogger } from '~/utils/logger';
import type { ModelInfo } from '~/lib/modules/llm/types';

const logger = createScopedLogger('ModelCache');

const STORAGE_KEY = 'codinit_model_cache';
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedProviderModels {
  provider: string;
  cacheId: string;
  models: ModelInfo[];
  timestamp: number;
  version: number;
}

interface ModelCacheStorage {
  version: number;
  providers: Record<string, CachedProviderModels>;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function saveModelsToCache(provider: string, cacheId: string, models: ModelInfo[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const existing = loadCacheFromStorage();

    existing.providers[provider] = {
      provider,
      cacheId,
      models,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    logger.debug(`CodinIT: Persisted ${models.length} models for ${provider} to localStorage`);
  } catch (error) {
    logger.error(`CodinIT: Failed to save models for ${provider} to localStorage`, error);
  }
}

export function loadModelsFromCache(provider: string, cacheId: string): ModelInfo[] | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const storage = loadCacheFromStorage();
    const cached = storage.providers[provider];

    if (!cached) {
      return null;
    }

    // Check version
    if (cached.version !== CACHE_VERSION) {
      logger.debug(`CodinIT: Cache version mismatch for ${provider}, invalidating`);
      delete storage.providers[provider];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return null;
    }

    // Check if cache is expired
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL_MS) {
      logger.debug(`CodinIT: Cache expired for ${provider} (age: ${Math.round(age / 1000 / 60)} minutes)`);
      delete storage.providers[provider];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return null;
    }

    // Check if cacheId matches
    if (cached.cacheId !== cacheId) {
      logger.debug(`CodinIT: Cache ID mismatch for ${provider}, invalidating`);
      delete storage.providers[provider];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return null;
    }

    logger.debug(`CodinIT: Loaded ${cached.models.length} models for ${provider} from localStorage`);
    return cached.models;
  } catch (error) {
    logger.error(`CodinIT: Failed to load models for ${provider} from localStorage`, error);
    return null;
  }
}

export function clearProviderCache(provider: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const storage = loadCacheFromStorage();
    delete storage.providers[provider];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    logger.info(`CodinIT: Cleared cache for ${provider}`);
  } catch (error) {
    logger.error(`CodinIT: Failed to clear cache for ${provider}`, error);
  }
}

export function clearAllModelsCache(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    logger.info('CodinIT: Cleared all model caches from localStorage');
  } catch (error) {
    logger.error('CodinIT: Failed to clear all model caches', error);
  }
}

export function getCacheStats(): {
  totalProviders: number;
  totalModels: number;
  providers: Array<{ name: string; modelCount: number; age: number }>;
} {
  if (!isBrowser()) {
    return { totalProviders: 0, totalModels: 0, providers: [] };
  }

  try {
    const storage = loadCacheFromStorage();
    const providers = Object.values(storage.providers);
    const now = Date.now();

    return {
      totalProviders: providers.length,
      totalModels: providers.reduce((sum, p) => sum + p.models.length, 0),
      providers: providers.map((p) => ({
        name: p.provider,
        modelCount: p.models.length,
        age: Math.round((now - p.timestamp) / 1000 / 60), // age in minutes
      })),
    };
  } catch (error) {
    logger.error('CodinIT: Failed to get cache stats', error);
    return { totalProviders: 0, totalModels: 0, providers: [] };
  }
}

function loadCacheFromStorage(): ModelCacheStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {
        version: CACHE_VERSION,
        providers: {},
      };
    }

    const parsed = JSON.parse(stored) as ModelCacheStorage;

    // Validate structure
    if (!parsed.version || !parsed.providers || typeof parsed.providers !== 'object') {
      logger.warn('CodinIT: Invalid cache structure, resetting');
      return {
        version: CACHE_VERSION,
        providers: {},
      };
    }

    // Clean up expired entries
    const now = Date.now();
    Object.keys(parsed.providers).forEach((provider) => {
      const cached = parsed.providers[provider];
      const age = now - cached.timestamp;

      if (age > CACHE_TTL_MS) {
        delete parsed.providers[provider];
      }
    });

    return parsed;
  } catch (error) {
    logger.error('CodinIT: Failed to load cache from localStorage, resetting', error);
    return {
      version: CACHE_VERSION,
      providers: {},
    };
  }
}
