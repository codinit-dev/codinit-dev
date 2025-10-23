import { useState, useEffect } from 'react';
import { checkForUpdates, acknowledgeUpdate } from '~/lib/api/updates';

const LAST_ACKNOWLEDGED_VERSION_KEY = 'bolt_last_acknowledged_version';

export const useUpdateCheck = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [lastAcknowledgedVersion, setLastAcknowledgedVersion] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_ACKNOWLEDGED_VERSION_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const { available, version } = await checkForUpdates();
        setCurrentVersion(version);

        // Only show update if it's a new version and hasn't been acknowledged
        setHasUpdate(available && version !== lastAcknowledgedVersion);
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check immediately and then every 30 minutes
    checkUpdate();

    const interval = setInterval(checkUpdate, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [lastAcknowledgedVersion]);

  const handleAcknowledgeUpdate = async () => {
    try {
      const { version } = await checkForUpdates();
      await acknowledgeUpdate(version);

      // Store in localStorage
      try {
        localStorage.setItem(LAST_ACKNOWLEDGED_VERSION_KEY, version);
      } catch (error) {
        console.error('Failed to persist acknowledged version:', error);
      }

      setLastAcknowledgedVersion(version);
      setHasUpdate(false);
    } catch (error) {
      console.error('Failed to acknowledge update:', error);
    }
  };

  return { hasUpdate, currentVersion, acknowledgeUpdate: handleAcknowledgeUpdate };
};
