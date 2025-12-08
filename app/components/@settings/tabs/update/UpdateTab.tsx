import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUpdateCheck } from '~/lib/hooks/useUpdateCheck';
import { toast } from 'react-toastify';
import { Dialog, DialogRoot, DialogTitle, DialogDescription, DialogButton } from '~/components/ui/Dialog';
import { classNames } from '~/utils/classNames';
import { Markdown } from '~/components/chat/Markdown';

interface UpdateSettings {
  autoUpdate: boolean;
  notifyInApp: boolean;
  checkInterval: number;
}

const UpdateTab = () => {
  const {
    hasUpdate,
    currentVersion,
    latestVersion,
    releaseNotes,
    releaseUrl,
    isLoading,
    error,
    acknowledgeUpdate,
    manualCheck,
  } = useUpdateCheck();
  const [updateSettings, setUpdateSettings] = useState<UpdateSettings>(() => {
    const stored = localStorage.getItem('update_settings');
    return stored
      ? JSON.parse(stored)
      : {
          autoUpdate: false,
          notifyInApp: true,
          checkInterval: 24,
        };
  });
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem('update_settings', JSON.stringify(updateSettings));
  }, [updateSettings]);

  const handleUpdate = () => {
    if (releaseUrl) {
      window.open(releaseUrl, '_blank');
    }

    acknowledgeUpdate();
    setShowUpdateDialog(false);
    toast.success('Update acknowledged');
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="i-ph:arrow-circle-up text-xl text-blue-500" />
        <div>
          <h3 className="text-lg font-medium text-codinit-elements-textPrimary">Updates</h3>
          <p className="text-sm text-codinit-elements-textSecondary">Check for and manage application updates</p>
        </div>
      </motion.div>

      {/* Update Settings Card */}
      <motion.div
        className="p-6 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="i-ph:gear text-blue-500 w-5 h-5" />
          <h3 className="text-lg font-medium text-codinit-elements-textPrimary">Update Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-codinit-elements-textPrimary">Automatic Updates</span>
              <p className="text-xs text-codinit-elements-textSecondary">
                Automatically check and apply updates when available
              </p>
            </div>
            <button
              onClick={() => setUpdateSettings((prev) => ({ ...prev, autoUpdate: !prev.autoUpdate }))}
              className={classNames(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                updateSettings.autoUpdate ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700',
              )}
            >
              <span
                className={classNames(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  updateSettings.autoUpdate ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-codinit-elements-textPrimary">In-App Notifications</span>
              <p className="text-xs text-codinit-elements-textSecondary">
                Show notifications when updates are available
              </p>
            </div>
            <button
              onClick={() => setUpdateSettings((prev) => ({ ...prev, notifyInApp: !prev.notifyInApp }))}
              className={classNames(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                updateSettings.notifyInApp ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700',
              )}
            >
              <span
                className={classNames(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  updateSettings.notifyInApp ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-codinit-elements-textPrimary">Check Interval</span>
              <p className="text-xs text-codinit-elements-textSecondary">How often to check for updates</p>
            </div>
            <select
              value={updateSettings.checkInterval}
              onChange={(e) => setUpdateSettings((prev) => ({ ...prev, checkInterval: Number(e.target.value) }))}
              className={classNames(
                'px-3 py-2 rounded-lg text-sm',
                'bg-[#F5F5F5] dark:bg-[#1A1A1A]',
                'border border-[#E5E5E5] dark:border-[#1A1A1A]',
                'text-codinit-elements-textPrimary',
                'hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A]',
                'transition-colors duration-200',
              )}
            >
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Update Status Card */}
      <motion.div
        className="p-6 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="i-ph:arrows-clockwise text-blue-500 w-5 h-5" />
            <h3 className="text-lg font-medium text-codinit-elements-textPrimary">Update Status</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasUpdate && (
              <button
                onClick={() => setShowUpdateDialog(true)}
                className={classNames(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                  'bg-blue-500 text-white',
                  'hover:bg-blue-600',
                  'transition-colors duration-200',
                )}
              >
                <div className="i-ph:arrow-circle-up w-4 h-4" />
                View Update
              </button>
            )}
            <button
              onClick={manualCheck}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                'bg-[#F5F5F5] dark:bg-[#1A1A1A]',
                'hover:bg-blue-500/10 hover:text-blue-500',
                'dark:hover:bg-blue-500/20 dark:hover:text-blue-500',
                'text-codinit-elements-textPrimary',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              disabled={isLoading}
              title={
                error?.includes('rate limit')
                  ? 'Rate limited by GitHub API. Try again later.'
                  : 'Check for updates manually'
              }
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="i-ph:arrows-clockwise w-4 h-4"
                  />
                  Checking...
                </div>
              ) : error?.includes('rate limit') ? (
                <>
                  <div className="i-ph:clock w-4 h-4" />
                  Rate Limited
                </>
              ) : (
                <>
                  <div className="i-ph:arrows-clockwise w-4 h-4" />
                  Refresh Check
                </>
              )}
            </button>
          </div>
        </div>

        {/* Show current version and update status */}
        <div className="mt-4 text-sm text-codinit-elements-textSecondary">
          <div className="flex items-center justify-between">
            <div>
              <p>
                Current version: <span className="font-mono">{currentVersion}</span>
              </p>
              {hasUpdate && latestVersion && (
                <p className="mt-1">
                  Latest version: <span className="font-mono text-green-600">{latestVersion}</span>
                </p>
              )}
              <p className="mt-1">
                Updates are checked from: <span className="font-mono">codinit-dev/codinit-dev</span> (GitHub releases)
              </p>
            </div>
            {hasUpdate && releaseUrl && (
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={classNames(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                  'bg-[#F5F5F5] dark:bg-[#1A1A1A]',
                  'hover:bg-blue-500/10 hover:text-blue-500',
                  'dark:hover:bg-blue-500/20 dark:hover:text-blue-500',
                  'text-codinit-elements-textPrimary',
                  'transition-colors duration-200',
                  'w-fit',
                )}
              >
                <div className="i-ph:github-logo w-4 h-4" />
                View Release on GitHub
              </a>
            )}
          </div>

          {/* Show release notes if available */}
          {hasUpdate && releaseNotes && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="i-ph:scroll text-blue-500 w-5 h-5" />
                <p className="font-medium text-codinit-elements-textPrimary">Release Notes</p>
              </div>
              <div className="bg-[#F5F5F5] dark:bg-[#1A1A1A] rounded-lg p-4 overflow-auto max-h-[300px]">
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <Markdown>{releaseNotes}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
            <div className="flex items-center gap-2 mb-2">
              <div className="i-ph:warning-circle-fill w-5 h-5" />
              <span className="font-medium">Update Check Failed</span>
            </div>
            <p className="text-sm">{error}</p>
            {error.includes('rate limit') && (
              <p className="text-xs mt-2 text-red-600 dark:text-red-300">
                💡 Tip: GitHub limits unauthenticated API requests. The limit resets hourly.
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Update dialog */}
      <DialogRoot open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <Dialog>
          <DialogTitle>Update Available</DialogTitle>
          <DialogDescription>
            <div className="mt-4">
              <p className="text-sm text-codinit-elements-textSecondary mb-4">
                A new version ({latestVersion}) is available from{' '}
                <span className="font-mono">codinit-dev/codinit-dev</span> on GitHub.
              </p>

              {releaseUrl && (
                <div className="mb-6">
                  <a
                    href={releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classNames(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                      'bg-[#F5F5F5] dark:bg-[#1A1A1A]',
                      'hover:bg-blue-500/10 hover:text-blue-500',
                      'dark:hover:bg-blue-500/20 dark:hover:text-blue-500',
                      'text-codinit-elements-textPrimary',
                      'transition-colors duration-200',
                      'w-fit',
                    )}
                  >
                    <div className="i-ph:github-logo w-4 h-4" />
                    View Release on GitHub
                  </a>
                </div>
              )}

              {releaseNotes && (
                <div className="mb-6">
                  <p className="font-medium mb-2">Release Notes:</p>
                  <div className="bg-[#F5F5F5] dark:bg-[#1A1A1A] rounded-lg p-3 max-h-[200px] overflow-auto">
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <Markdown>{releaseNotes}</Markdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <DialogButton type="secondary" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </DialogButton>
            <DialogButton type="primary" onClick={handleUpdate}>
              View Release
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </div>
  );
};

export default UpdateTab;
