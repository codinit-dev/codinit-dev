import { useCallback, useState, useEffect } from 'react';
import type { IProviderConfig } from '~/types/model';
import { updateProviderSettings } from '~/lib/stores/settings';

export interface UseLocalProvidersReturn {
  localProviders: IProviderConfig[];
  refreshLocalProviders: () => void;
  isChecking: boolean;
}

export function useLocalProviders(): UseLocalProvidersReturn {
  const [localProviders, setLocalProviders] = useState<IProviderConfig[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkLocalProvider = useCallback(
    async (name: string, baseUrl: string, icon: string): Promise<IProviderConfig | null> => {
      try {
        // Try to connect to the local provider
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          return {
            name,
            icon,
            getApiKeyLink: `https://${name.toLowerCase()}.com/download`,
            labelForGetApiKey: `Download ${name}`,
            staticModels: [],
            settings: {
              enabled: true,
              baseUrl,
            },
          };
        }
      } catch {
        // Provider not available, return null
      }
      return null;
    },
    [],
  );

  const refreshLocalProviders = useCallback(async () => {
    setIsChecking(true);

    try {
      const providers: IProviderConfig[] = [];

      // Check Ollama

      const ollamaProvider = await checkLocalProvider(
        'Ollama',
        'http://localhost:11434',
        '/thirdparty/logos/ollama.svg',
      );

      if (ollamaProvider) {
        providers.push(ollamaProvider);
      }

      // Check LMStudio

      const lmStudioProvider = await checkLocalProvider(
        'LMStudio',
        'http://localhost:1234',
        '/thirdparty/logos/lmstudio.svg',
      );

      if (lmStudioProvider) {
        providers.push(lmStudioProvider);
      }

      setLocalProviders(providers);

      // Enable detected providers in settings
      providers.forEach((provider) => {
        updateProviderSettings(provider.name, { enabled: true, baseUrl: provider.settings.baseUrl });
      });

      // Disable providers that are no longer available
      const availableProviderNames = providers.map((p) => p.name);
      const allLocalProviderNames = ['Ollama', 'LMStudio'];

      allLocalProviderNames.forEach((providerName) => {
        if (!availableProviderNames.includes(providerName)) {
          updateProviderSettings(providerName, { enabled: false });
        }
      });
    } catch (error) {
      console.error('Error checking local providers:', error);
      setLocalProviders([]);

      // Disable all local providers if there's an error
      ['Ollama', 'LMStudio'].forEach((providerName) => {
        updateProviderSettings(providerName, { enabled: false });
      });
    } finally {
      setIsChecking(false);
    }
  }, [checkLocalProvider]);

  // Auto-refresh on mount
  useEffect(() => {
    refreshLocalProviders();
  }, [refreshLocalProviders]);

  return {
    localProviders,
    refreshLocalProviders,
    isChecking,
  };
}
