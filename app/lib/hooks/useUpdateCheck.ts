import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { checkForUpdates, acknowledgeUpdate } from '~/lib/api/updates';

const LAST_ACKNOWLEDGED_VERSION_KEY = 'codinit_last_acknowledged_version';

// Define the interface for the window object with electronUpdates
declare global {
  interface Window {
    electronUpdates?: {
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      quitAndInstall: () => Promise<void>;
      onCheckingForUpdate: (callback: () => void) => () => void;
      onUpdateAvailable: (callback: (info: any) => void) => () => void;
      onUpdateNotAvailable: (callback: (info: any) => void) => () => void;
      onDownloadProgress: (callback: (progressObj: any) => void) => () => void;
      onUpdateDownloaded: (callback: (info: any) => void) => () => void;
      onError: (callback: (error: string) => void) => () => void;
    };
  }
}

export const useUpdateCheck = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [releaseUrl, setReleaseUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAcknowledgedVersion, setLastAcknowledgedVersion] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_ACKNOWLEDGED_VERSION_KEY);
    } catch {
      return null;
    }
  });

  const isElectron = typeof window !== 'undefined' && !!window.electronUpdates;

  const checkUpdate = useCallback(
    async (showToast = true) => {
      console.log('🔄 Checking for updates...');
      setIsLoading(true);
      setError(null);

      try {
        if (isElectron) {
          // Electron mode: Trigger check via IPC, results come via events
          await window.electronUpdates?.checkForUpdates();
          // We don't set loading false immediately here as we wait for events
        } else {
          // Web mode: Normal API check
          const result = await checkForUpdates();
          console.log('📦 Update check result:', result);

          if (result.error) {
            console.error('❌ Update check error:', result.error);
            setError(result.error.message);
            setHasUpdate(false);
            setIsLoading(false);
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
              );
            }
          } else {
            console.log('✅ App is up to date');
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('💥 Failed to check for updates:', error);
        setError('Failed to check for updates');
        setHasUpdate(false);
        setIsLoading(false);
      }
    },
    [lastAcknowledgedVersion, isElectron],
  );

  useEffect(() => {
    checkUpdate();
    const interval = setInterval(() => checkUpdate(false), 30 * 60 * 1000); // 30 min check
    return () => clearInterval(interval);
  }, [checkUpdate]);

  // IPC Event Listeners for Electron
  useEffect(() => {
    if (!isElectron || !window.electronUpdates) return;

    const unsubChecking = window.electronUpdates.onCheckingForUpdate(() => {
      console.log('IPC: Checking for update...');
      setIsLoading(true);
    });

    const unsubAvailable = window.electronUpdates.onUpdateAvailable((info) => {
      console.log('IPC: Update available', info);
      setIsLoading(false);
      setLatestVersion(info.version);
      setReleaseNotes(info.releaseNotes || ''); // Electron-updater might provide this
      setHasUpdate(true);
      // Assuming initial check provides current version elsewhere or we parse it. 
      // For now, we might rely on initial state or other means, but let's assume we proceed.
    });

    const unsubNotAvailable = window.electronUpdates.onUpdateNotAvailable((info) => {
      console.log('IPC: Update not available', info);
      setIsLoading(false);
      setHasUpdate(false);
    });

    const unsubProgress = window.electronUpdates.onDownloadProgress((progressObj) => {
      setIsDownloading(true);
      setDownloadProgress(progressObj.percent);
    });

    const unsubDownloaded = window.electronUpdates.onUpdateDownloaded((info) => {
      console.log('IPC: Update downloaded', info);
      setIsDownloading(false);
      setIsReadyToInstall(true);
      toast.success('Update downloaded! Ready to install.');
    });

    const unsubError = window.electronUpdates.onError((err) => {
      console.error('IPC: Update error', err);
      setIsLoading(false);
      setIsDownloading(false);
      setError(err);
    });

    return () => {
      unsubChecking();
      unsubAvailable();
      unsubNotAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
    };
  }, [isElectron]);


  const handleAcknowledgeUpdate = async () => {
    // For web, we acknowledge. For Electron, "acknowledging" typically implies dismissing or closing.
    // If we want to hide it until next time:
    if (!isElectron) {
      // ... existing web logic ...
      console.log('👆 Acknowledging update...');
      try {
        const result = await checkForUpdates();
        if (!result.error) {
          await acknowledgeUpdate(result.version);
          // ... persistence ...
          try {
            localStorage.setItem(LAST_ACKNOWLEDGED_VERSION_KEY, result.version);
          } catch (error) {
            console.error('Failed to persist acknowledged version:', error);
          }
          setLastAcknowledgedVersion(result.version);
          setHasUpdate(false);
        }
      } catch (e) { console.error(e) }
    } else {
      // Electron: Just hide it locally
      setHasUpdate(false);
      // Optionally persist skip
    }
  };

  const downloadAndInstall = () => {
    if (isElectron && window.electronUpdates) {
      window.electronUpdates.downloadUpdate();
      setIsDownloading(true);
    }
  }

  const quitAndInstall = () => {
    if (isElectron && window.electronUpdates) {
      window.electronUpdates.quitAndInstall();
    }
  }

  return {
    hasUpdate,
    currentVersion, // Note: In electron, might need to fetch app version explicitly if not available
    latestVersion,
    releaseNotes,
    releaseUrl,
    isLoading,
    isDownloading,
    downloadProgress,
    isReadyToInstall,
    error,
    acknowledgeUpdate: handleAcknowledgeUpdate,
    manualCheck: () => checkUpdate(false),
    downloadAndInstall,
    quitAndInstall,
    isElectron
  };
};
