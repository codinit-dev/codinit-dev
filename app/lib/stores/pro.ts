import { map } from 'nanostores';

export interface ProState {
  isPro: boolean;
  tier: 'free' | 'pro';
  credits: {
    total: number;
    used: number;
  };
  features: {
    webSearch: boolean;
    lazyEdits: boolean;
  };
}

export const proStore = map<ProState>({
  isPro: false,
  tier: 'free',
  credits: {
    total: 0,
    used: 0,
  },
  features: {
    webSearch: false,
    lazyEdits: false,
  },
});

export const setProState = (state: Partial<ProState>) => {
  proStore.set({
    ...proStore.get(),
    ...state,
  });
};

export const toggleFeature = (feature: keyof ProState['features']) => {
  const currentState = proStore.get();
  proStore.setKey('features', {
    ...currentState.features,
    [feature]: !currentState.features[feature],
  });
};

export const verifyProKey = async (apiKey: string, baseUrl: string = 'https://api.codinit.dev/v1') => {
  try {
    const response = await fetch(`${baseUrl}/user/info`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid API Key or backend unreachable');
    }

    const data = (await response.json()) as {
      tier: 'free' | 'pro';
      totalCredits: number;
      usedCredits: number;
    };

    setProState({
      isPro: data.tier === 'pro',
      tier: data.tier,
      credits: {
        total: data.totalCredits,
        used: data.usedCredits,
      },
    });

    return data;
  } catch (error) {
    console.error('Pro verification failed:', error);
    setProState({ isPro: false, tier: 'free' });
    throw error;
  }
};
