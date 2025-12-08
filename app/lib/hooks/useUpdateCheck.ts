import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { checkForUpdates, acknowledgeUpdate } from '~/lib/api/updates';

const LAST_ACKNOWLEDGED_VERSION_KEY = 'codinit_last_acknowledged_version';

export const useUpdateCheck = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [releaseUrl, setReleaseUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAcknowledgedVersion, setLastAcknowledgedVersion] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_ACKNOWLEDGED_VERSION_KEY);
    } catch {
      return null;
    }
  });

  const checkUpdate = useCallback(
    async (showToast = true) => {
      console.log('🔄 Checking for updates...');
      setIsLoading(true);
      setError(null);

      try {
        const result = await checkForUpdates();
        console.log('📦 Update check result:', result);

        if (result.error) {
          console.error('❌ Update check error:', result.error);
          setError(result.error.message);
          setHasUpdate(false);

          return;
        }

        setCurrentVersion(result.currentVersion);
        setLatestVersion(result.version);
        setReleaseNotes(result.releaseNotes || '');
        setReleaseUrl(result.releaseUrl || '');

        const shouldShowUpdate = result.available && result.version !== lastAcknowledgedVersion;
        setHasUpdate(shouldShowUpdate);

        if (result.available) {
          console.log('✨ Update available:', result.version);

          if (shouldShowUpdate && showToast) {
            toast.info(
              `New version v${result.version} available! Please update to get the latest features and improvements.`,
              {
                position: 'top-right',
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                toastId: 'update-notification',
              },
            );
          }
        } else {
          console.log('✅ App is up to date');
        }
      } catch (error) {
        console.error('💥 Failed to check for updates:', error);
        setError('Failed to check for updates');
        setHasUpdate(false);
      } finally {
        setIsLoading(false);
      }
    },
    [lastAcknowledgedVersion],
  );

  useEffect(() => {
    checkUpdate();

    const interval = setInterval(() => checkUpdate(), 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkUpdate]);

  const handleAcknowledgeUpdate = async () => {
    console.log('👆 Acknowledging update...');

    try {
      const result = await checkForUpdates();

      if (!result.error) {
        await acknowledgeUpdate(result.version);
        console.log('✅ Update acknowledged:', result.version);

        // Store in localStorage
        try {
          localStorage.setItem(LAST_ACKNOWLEDGED_VERSION_KEY, result.version);
        } catch (error) {
          console.error('Failed to persist acknowledged version:', error);
        }

        setLastAcknowledgedVersion(result.version);
        setHasUpdate(false);
        toast.dismiss('update-notification');
      }
    } catch (error) {
      console.error('💥 Failed to acknowledge update:', error);
    }
  };

  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    releaseNotes,
    releaseUrl,
    isLoading,
    error,
    acknowledgeUpdate: handleAcknowledgeUpdate,
    manualCheck: () => checkUpdate(false),
  };
};
