export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
}

const FEATURES_STORAGE_KEY = 'codinit_feature_flags';
const VIEWED_FEATURES_KEY = 'codinit_viewed_features';

// Define available features
const DEFAULT_FEATURES: Feature[] = [
  {
    id: 'feature-1',
    name: 'Dark Mode',
    description: 'Enable dark mode for better night viewing',
    viewed: false,
    releaseDate: '2024-03-15',
  },
  {
    id: 'feature-2',
    name: 'Tab Management',
    description: 'Customize your tab layout',
    viewed: false,
    releaseDate: '2024-03-20',
  },
  {
    id: 'feature-3',
    name: 'Multi-Provider Support',
    description: 'Connect to 19+ different AI providers',
    viewed: false,
    releaseDate: '2024-04-01',
  },
  {
    id: 'feature-4',
    name: 'WebContainer Integration',
    description: 'Run full Node.js environment in your browser',
    viewed: false,
    releaseDate: '2024-04-15',
  },
];

// Helper to check if running in browser
const isBrowser = typeof window !== 'undefined';

// Get viewed features from localStorage
const getViewedFeatures = (): Set<string> => {
  if (!isBrowser) {
    return new Set();
  }

  try {
    const stored = localStorage.getItem(VIEWED_FEATURES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (error) {
    console.error('Failed to load viewed features:', error);
    return new Set();
  }
};

// Save viewed features to localStorage
const saveViewedFeatures = (viewedIds: Set<string>): void => {
  if (!isBrowser) {
    return;
  }

  try {
    localStorage.setItem(VIEWED_FEATURES_KEY, JSON.stringify(Array.from(viewedIds)));
  } catch (error) {
    console.error('Failed to save viewed features:', error);
  }
};

export const getFeatureFlags = async (): Promise<Feature[]> => {
  const viewedFeatures = getViewedFeatures();

  // Merge default features with viewed status
  const features = DEFAULT_FEATURES.map((feature) => ({
    ...feature,
    viewed: viewedFeatures.has(feature.id),
  }));

  // Sort by release date (newest first) and then by viewed status (unviewed first)
  return features.sort((a, b) => {
    if (a.viewed !== b.viewed) {
      return a.viewed ? 1 : -1; // Unviewed features first
    }

    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });
};

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  const viewedFeatures = getViewedFeatures();
  viewedFeatures.add(featureId);
  saveViewedFeatures(viewedFeatures);
};

// Utility function to add a new feature dynamically (for future extensibility)
export const addFeature = (feature: Feature): void => {
  if (!isBrowser) {
    return;
  }

  try {
    const stored = localStorage.getItem(FEATURES_STORAGE_KEY);
    const features = stored ? JSON.parse(stored) : DEFAULT_FEATURES;
    features.push(feature);
    localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
  } catch (error) {
    console.error('Failed to add feature:', error);
  }
};

// Check if there are any unviewed features
export const hasUnviewedFeatures = async (): Promise<boolean> => {
  const features = await getFeatureFlags();
  return features.some((feature) => !feature.viewed);
};
