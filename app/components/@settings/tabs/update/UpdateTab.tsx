import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateCheck } from '~/lib/hooks/useUpdateCheck';
import Cookies from 'js-cookie';
import { classNames } from '~/utils/classNames';
import { Markdown } from '~/components/chat/Markdown';
import { GITHUB_REPOSITORY } from '~/lib/version';
import { SettingsSection, SettingsCard } from '~/components/@settings/shared/components/SettingsCard';
import { Button } from '~/components/ui/Button';

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
    isDownloading,
    downloadProgress,
    isReadyToInstall,
    error,
    manualCheck,
    downloadAndInstall,
    quitAndInstall,
    isElectron,
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

  useEffect(() => {
    /*
     * if (hasUpdate && !isDownloading && !isReadyToInstall) {
     *   setShowUpdateDialog(true);
     * }
     */
  }, [hasUpdate, isDownloading, isReadyToInstall]);

  useEffect(() => {
    localStorage.setItem('update_settings', JSON.stringify(updateSettings));
  }, [updateSettings]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <SettingsSection title="System Status" icon="i-ph:info-fill">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Status Dashboard */}
          <div className="md:col-span-2 space-y-6">
            <SettingsCard className="p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="i-ph:activity text-blue-500 w-5 h-5" />
                  <h3 className="text-lg font-semibold text-codinit-elements-textPrimary">System Health</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-green-500 uppercase tracking-wider">Connected</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100 dark:bg-gray-700/50" />

                <div className="space-y-1">
                  <span className="text-xs text-codinit-elements-textSecondary uppercase tracking-widest font-semibold">
                    Installed Version
                  </span>
                  <div className="text-2xl font-mono font-bold text-codinit-elements-textPrimary tabular-nums">
                    v{currentVersion}
                  </div>
                </div>

                <div className="space-y-1 pl-4">
                  <span className="text-xs text-codinit-elements-textSecondary uppercase tracking-widest font-semibold">
                    Latest Release
                  </span>
                  <div
                    className={classNames(
                      'text-2xl font-mono font-bold tabular-nums',
                      hasUpdate ? 'text-green-500' : 'text-codinit-elements-textPrimary',
                    )}
                  >
                    v{latestVersion || currentVersion}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-codinit-elements-textSecondary">
                    <div className="i-ph:git-branch w-4 h-4" />
                    <span className="hidden sm:inline">Updates tracked via {GITHUB_REPOSITORY}</span>
                    <span className="sm:hidden">GitHub</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isReadyToInstall ? (
                      <Button
                        onClick={quitAndInstall}
                        className="bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20"
                      >
                        <div className="i-ph:power-bold w-4 h-4 mr-2" />
                        Restart to Install
                      </Button>
                    ) : isDownloading ? (
                      <div className="flex items-center gap-4 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/20 min-w-[150px]">
                        <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-900/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-blue-500">{Math.round(downloadProgress)}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={manualCheck} disabled={isLoading} className="gap-2">
                          <div
                            className={classNames('i-ph:arrows-clockwise-bold w-4 h-4', { 'animate-spin': isLoading })}
                          />
                          {isLoading ? 'Checking...' : 'Refresh'}
                        </Button>

                        {(hasUpdate || Cookies.get('codinit_update_snooze') === latestVersion) && (
                          <Button
                            onClick={() => (isElectron ? downloadAndInstall() : window.open(releaseUrl, '_blank'))}
                            className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                          >
                            <div className="i-ph:download-simple-bold w-4 h-4 mr-2" />
                            Update Now
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* Release Notes Explorer - Integrated Card */}
            <AnimatePresence mode="wait">
              {(hasUpdate || Cookies.get('codinit_update_snooze') === latestVersion) && releaseNotes && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                  <SettingsCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="i-ph:scroll text-blue-500 w-5 h-5" />
                        <h3 className="text-lg font-semibold text-codinit-elements-textPrimary">Release Notes</h3>
                      </div>
                      {releaseUrl && (
                        <a
                          href={releaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                          View on GitHub <div className="i-ph:arrow-square-out w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white dark:from-gray-800/40 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="bg-gray-50/50 dark:bg-gray-900/40 rounded-xl p-5 overflow-auto max-h-[400px] border border-gray-100 dark:border-gray-800 modern-scrollbar">
                        <div className="prose dark:prose-invert prose-blue prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-500">
                          <Markdown>{releaseNotes}</Markdown>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white dark:from-gray-800/40 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </SettingsCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preferences Sidebar */}
          <div className="space-y-6">
            <SettingsCard className="p-6">
              <h3 className="text-sm font-bold text-codinit-elements-textPrimary uppercase tracking-wider mb-6 flex items-center gap-2">
                <div className="i-ph:sliders-horizontal w-4 h-4" />
                Preferences
              </h3>

              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-codinit-elements-textPrimary">Auto-Update</div>
                    <div className="text-xs text-codinit-elements-textSecondary leading-relaxed">
                      Download and apply updates automatically
                    </div>
                  </div>
                  <button
                    onClick={() => setUpdateSettings((prev) => ({ ...prev, autoUpdate: !prev.autoUpdate }))}
                    className={classNames(
                      'relative flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent ring-offset-2',
                      updateSettings.autoUpdate ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                    )}
                  >
                    <span
                      className={classNames(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-1',
                        updateSettings.autoUpdate ? 'translate-x-6' : 'translate-x-1',
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-codinit-elements-textPrimary">Notifications</div>
                    <div className="text-xs text-codinit-elements-textSecondary leading-relaxed">
                      Notify when new features are available
                    </div>
                  </div>
                  <button
                    onClick={() => setUpdateSettings((prev) => ({ ...prev, notifyInApp: !prev.notifyInApp }))}
                    className={classNames(
                      'relative flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent ring-offset-2',
                      updateSettings.notifyInApp ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                    )}
                  >
                    <span
                      className={classNames(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-1',
                        updateSettings.notifyInApp ? 'translate-x-6' : 'translate-x-1',
                      )}
                    />
                  </button>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="text-sm font-semibold text-codinit-elements-textPrimary">Check Frequency</div>
                  <select
                    value={updateSettings.checkInterval}
                    onChange={(e) => setUpdateSettings((prev) => ({ ...prev, checkInterval: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-codinit-elements-textPrimary focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option value="6">Every 6 hours</option>
                    <option value="12">Every 12 hours</option>
                    <option value="24">Every 24 hours (Recommended)</option>
                    <option value="48">Every 2 days</option>
                  </select>
                </div>
              </div>
            </SettingsCard>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                  <div className="i-ph:warning-circle-fill w-4 h-4" />
                  Error Occurred
                </div>
                <p className="text-xs leading-relaxed">{error}</p>
              </motion.div>
            )}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default UpdateTab;
