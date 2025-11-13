import type { UserProfile } from '~/components/@settings/core/types';

export interface SearchableSetting {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'toggle' | 'select' | 'input' | 'action';
  value: any;
  keywords: string[];
  icon: string;
  lastModified?: Date;
  path?: string; // For navigation if needed
  action?: () => void | Promise<void>; // For action type settings
}

export interface RecentSetting extends SearchableSetting {
  lastAccessed: Date;
}

let settingsRegistry: SearchableSetting[] = [];
let recentSettings: RecentSetting[] = [];

// Initialize the search index
export const initializeSearchIndex = (userProfile: UserProfile) => {
  settingsRegistry = buildSettingsRegistry(userProfile);
  loadRecentSettings();
};

// Build the complete settings registry
const buildSettingsRegistry = (userProfile: UserProfile): SearchableSetting[] => {
  const settings: SearchableSetting[] = [
    // Language & Localization
    {
      id: 'language',
      title: 'Language',
      description: 'Change the application language',
      category: 'Preferences',
      type: 'select',
      value: userProfile.language || 'en',
      keywords: ['locale', 'i18n', 'internationalization', 'language', 'lang'],
      icon: 'i-ph:translate-fill',
      path: 'settings',
    },

    // Notifications
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Enable or disable push notifications',
      category: 'Preferences',
      type: 'toggle',
      value: userProfile.notifications ?? true,
      keywords: ['alerts', 'push', 'notification', 'notify', 'alert'],
      icon: 'i-ph:bell-fill',
      path: 'settings',
    },

    // Timezone
    {
      id: 'timezone',
      title: 'Timezone',
      description: 'Set your local timezone',
      category: 'Preferences',
      type: 'select',
      value: userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      keywords: ['time', 'zone', 'local', 'region', 'clock'],
      icon: 'i-ph:globe-fill',
      path: 'settings',
    },

    // Feature Toggles
    {
      id: 'latestBranch',
      title: 'Main Branch Updates',
      description: 'Get the latest updates from the main branch',
      category: 'Features',
      type: 'toggle',
      value: true, // Default value
      keywords: ['updates', 'branch', 'main', 'latest', 'version', 'git'],
      icon: 'i-ph:git-branch',
      path: 'features',
    },

    {
      id: 'autoSelectTemplate',
      title: 'Auto Select Template',
      description: 'Automatically select starter template',
      category: 'Features',
      type: 'toggle',
      value: true,
      keywords: ['template', 'auto', 'select', 'starter', 'project'],
      icon: 'i-ph:selection',
      path: 'features',
    },

    {
      id: 'contextOptimization',
      title: 'Context Optimization',
      description: 'Optimize context for better responses',
      category: 'Features',
      type: 'toggle',
      value: true,
      keywords: ['context', 'optimize', 'ai', 'response', 'performance'],
      icon: 'i-ph:brain',
      path: 'features',
    },

    {
      id: 'eventLogs',
      title: 'Event Logging',
      description: 'Enable detailed event logging and history',
      category: 'Features',
      type: 'toggle',
      value: true,
      keywords: ['logs', 'events', 'history', 'debug', 'tracking'],
      icon: 'i-ph:list-bullets',
      path: 'features',
    },

    // Quick Actions
    {
      id: 'resetSettings',
      title: 'Reset All Settings',
      description: 'Reset all settings to their default values',
      category: 'Actions',
      type: 'action',
      value: null,
      keywords: ['reset', 'default', 'clear', 'restore', 'factory'],
      icon: 'i-ph:arrow-counter-clockwise',
      action: () => {
        // Implementation will be added
        console.log('Reset settings action');
      },
    },

    {
      id: 'exportSettings',
      title: 'Export Settings',
      description: 'Export your settings to a file',
      category: 'Actions',
      type: 'action',
      value: null,
      keywords: ['export', 'backup', 'save', 'file', 'download'],
      icon: 'i-ph:download',
      action: () => {
        // Implementation will be added
        console.log('Export settings action');
      },
    },

    {
      id: 'importSettings',
      title: 'Import Settings',
      description: 'Import settings from a file',
      category: 'Actions',
      type: 'action',
      value: null,
      keywords: ['import', 'restore', 'load', 'file', 'upload'],
      icon: 'i-ph:upload',
      action: () => {
        // Implementation will be added
        console.log('Import settings action');
      },
    },
  ];

  return settings;
};

// Simple search functionality (can be enhanced with Fuse.js later)
export const searchSettings = (query: string): SearchableSetting[] => {
  if (!query.trim()) {
    return getDefaultResults();
  }

  const searchTerm = query.toLowerCase();
  const results = settingsRegistry.filter((setting) => {
    const searchableText = [setting.title, setting.description, ...setting.keywords, setting.category]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(searchTerm);
  });

  // Sort by relevance (title matches first, then description, then keywords)
  return results.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(searchTerm);
    const bTitle = b.title.toLowerCase().includes(searchTerm);

    if (aTitle && !bTitle) {
      return -1;
    }

    if (!aTitle && bTitle) {
      return 1;
    }

    return 0;
  });
};

// Get default results when no search query
const getDefaultResults = (): SearchableSetting[] => {
  const recent = getRecentSettings();

  if (recent.length > 0) {
    return recent;
  }

  // Return popular/quick access settings
  return settingsRegistry.filter((setting) =>
    ['language', 'notifications', 'contextOptimization', 'autoSelectTemplate'].includes(setting.id),
  );
};

// Recent settings management
const RECENT_SETTINGS_KEY = 'codinit_recent_settings';

const loadRecentSettings = () => {
  try {
    const stored = localStorage.getItem(RECENT_SETTINGS_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      recentSettings = parsed.map((item: any) => ({
        ...item,
        lastAccessed: new Date(item.lastAccessed),
      }));
    }
  } catch (error) {
    console.warn('Failed to load recent settings:', error);
    recentSettings = [];
  }
};

const saveRecentSettings = () => {
  try {
    localStorage.setItem(RECENT_SETTINGS_KEY, JSON.stringify(recentSettings));
  } catch (error) {
    console.warn('Failed to save recent settings:', error);
  }
};

export const addToRecentSettings = (settingId: string) => {
  const setting = settingsRegistry.find((s) => s.id === settingId);

  if (!setting) {
    return;
  }

  // Remove if already exists
  recentSettings = recentSettings.filter((s) => s.id !== settingId);

  // Add to beginning
  recentSettings.unshift({
    ...setting,
    lastAccessed: new Date(),
  });

  // Keep only last 10
  recentSettings = recentSettings.slice(0, 10);

  saveRecentSettings();
};

export const getRecentSettings = (): SearchableSetting[] => {
  return recentSettings.slice(0, 5); // Return top 5 recent settings
};

// Update setting value
export const updateSettingValue = (settingId: string, newValue: any) => {
  const setting = settingsRegistry.find((s) => s.id === settingId);

  if (setting) {
    setting.value = newValue;
    setting.lastModified = new Date();
    addToRecentSettings(settingId);
  }
};

// Get setting by ID
export const getSettingById = (settingId: string): SearchableSetting | undefined => {
  return settingsRegistry.find((s) => s.id === settingId);
};

// Get all settings (for debugging)
export const getAllSettings = (): SearchableSetting[] => {
  return [...settingsRegistry];
};

// Get settings by category
export const getSettingsByCategory = (category: string): SearchableSetting[] => {
  return settingsRegistry.filter((s) => s.category === category);
};
