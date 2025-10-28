import { atom } from 'nanostores';

export interface TokenConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface TokenPreset {
  id: string;
  name: string;
  description: string;
  config: TokenConfig;
}

// Default presets
export const TOKEN_PRESETS: TokenPreset[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'Automatically optimized for best results',
    config: {
      // Auto will use defaults from the model/provider
    },
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced between creativity and consistency',
    config: {
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'More creative and diverse responses',
    config: {
      temperature: 1.0,
      topP: 0.95,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
    },
  },
  {
    id: 'precise',
    name: 'Precise',
    description: 'More focused and deterministic responses',
    config: {
      temperature: 0.3,
      topP: 0.5,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Configure your own parameters',
    config: {
      temperature: 0.7,
      topP: 0.9,
    },
  },
];

const STORAGE_KEY = 'codinit_token_config';

// Initialize from localStorage or default to 'auto'
const getInitialPreset = (): string => {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.selectedPreset || 'auto';
    }
  } catch (error) {
    console.error('Error loading token config:', error);
  }

  return 'auto';
};

const getInitialCustomConfig = (): TokenConfig => {
  if (typeof window === 'undefined') {
    return TOKEN_PRESETS.find((p) => p.id === 'auto')?.config || {};
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.customConfig || TOKEN_PRESETS.find((p) => p.id === 'custom')?.config || {};
    }
  } catch (error) {
    console.error('Error loading custom token config:', error);
  }

  return TOKEN_PRESETS.find((p) => p.id === 'custom')?.config || {};
};

// Stores
export const selectedPresetStore = atom<string>(getInitialPreset());
export const customConfigStore = atom<TokenConfig>(getInitialCustomConfig());

// Helper functions
export const updateSelectedPreset = (presetId: string) => {
  selectedPresetStore.set(presetId);

  saveToLocalStorage();
};

export const updateCustomConfig = (config: Partial<TokenConfig>) => {
  const current = customConfigStore.get();

  customConfigStore.set({ ...current, ...config });
  saveToLocalStorage();
};

export const getActiveConfig = (): TokenConfig | undefined => {
  const presetId = selectedPresetStore.get();

  if (presetId === 'auto') {
    return undefined; // Let the API use defaults
  }

  if (presetId === 'custom') {
    return customConfigStore.get();
  }

  const preset = TOKEN_PRESETS.find((p) => p.id === presetId);

  return preset?.config;
};

const saveToLocalStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const data = {
      selectedPreset: selectedPresetStore.get(),
      customConfig: customConfigStore.get(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving token config:', error);
  }
};
