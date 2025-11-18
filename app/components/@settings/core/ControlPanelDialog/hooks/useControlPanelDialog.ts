import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { tabConfigurationStore, developerModeStore } from '~/lib/stores/settings';
import type { TabType, TabVisibilityConfig } from '~/components/@settings/core/types';

export function useControlPanelDialog(initialTab: TabType = 'settings') {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const tabConfiguration = useStore(tabConfigurationStore);
  const isDeveloperMode = useStore(developerModeStore);

  // Get visible tabs based on current configuration
  const visibleTabs = useMemo(() => {
    const currentWindow = isDeveloperMode ? 'developer' : 'user';
    const tabsArray = currentWindow === 'developer' ? tabConfiguration.developerTabs : tabConfiguration.userTabs;

    return tabsArray
      .filter((tab: TabVisibilityConfig) => tab.visible)
      .sort((a: TabVisibilityConfig, b: TabVisibilityConfig) => a.order - b.order);
  }, [tabConfiguration, isDeveloperMode]);

  // Ensure active tab is valid when configuration changes
  useEffect(() => {
    if (!visibleTabs.find((tab: TabVisibilityConfig) => tab.id === activeTab)) {
      const firstVisibleTab = visibleTabs[0];

      if (firstVisibleTab) {
        setActiveTab(firstVisibleTab.id);
      }
    }
  }, [visibleTabs, activeTab]);

  // Reset to initial tab when dialog opens

  useEffect(() => {
    if (visibleTabs.find((tab: TabVisibilityConfig) => tab.id === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab, visibleTabs]);

  return {
    activeTab,
    setActiveTab,
    visibleTabs,
    isDeveloperMode,
  };
}
