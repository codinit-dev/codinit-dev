import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import {
  cloudflareConnection,
  isConnecting,
  isFetchingStats,
  updateCloudflareConnection,
  fetchCloudflareStats,
} from '~/lib/stores/cloudflare';

export default function CloudflareConnection() {
  const connection = useStore(cloudflareConnection);
  const connecting = useStore(isConnecting);
  const fetchingStats = useStore(isFetchingStats);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (connection.user && connection.token && connection.accountId) {
        await fetchCloudflareStats(connection.token, connection.accountId);
      }
    };
    fetchProjects();
  }, [connection.user, connection.token, connection.accountId]);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    isConnecting.set(true);

    try {
      // First verify the token and account ID
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${connection.accountId}`, {
        headers: {
          Authorization: `Bearer ${connection.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token or account ID');
      }

      const accountData = (await response.json()) as any;
      updateCloudflareConnection({
        user: accountData.result,
        token: connection.token,
        accountId: connection.accountId,
      });

      await fetchCloudflareStats(connection.token, connection.accountId);
      toast.success('Successfully connected to Cloudflare');
    } catch (error) {
      console.error('Auth error:', error);
      logStore.logError('Failed to authenticate with Cloudflare', { error });
      toast.error('Failed to connect to Cloudflare');
      updateCloudflareConnection({ user: null, token: '', accountId: '' });
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = () => {
    updateCloudflareConnection({ user: null, token: '', accountId: '' });
    toast.success('Disconnected from Cloudflare');
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5 dark:invert"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/cloudflare/black"
            />
            <h3 className="text-base font-medium text-codinit-elements-textPrimary">Cloudflare Connection</h3>
          </div>
        </div>

        {connection.user ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDisconnect}
                  className={classNames(
                    'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                    'bg-red-500 text-white',
                    'hover:bg-red-600',
                  )}
                >
                  <div className="i-ph:plug w-4 h-4"></div>
                  Disconnect
                </button>
                <span className="text-sm text-codinit-elements-textSecondary flex items-center gap-1">
                  <div className="i-ph:check-circle w-4 h-4 text-green-500"></div>
                  Connected to Cloudflare
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-lg">
              <div className="text-sm text-codinit-elements-textSecondary">
                Account: {connection.user.name || 'Cloudflare Account'}
              </div>
            </div>

            {fetchingStats ? (
              <div className="flex items-center gap-2 text-sm text-codinit-elements-textSecondary">
                <div className="i-ph:spinner-gap w-4 h-4 animate-spin"></div>
                Fetching Cloudflare Pages projects...
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="w-full bg-transparent text-left text-sm font-medium text-codinit-elements-textPrimary mb-3 flex items-center gap-2"
                >
                  <div className="i-ph:buildings w-4 h-4"></div>
                  Your Pages Projects ({connection.stats?.totalProjects || 0})
                  <div
                    className={classNames(
                      'i-ph:caret-down w-4 h-4 ml-auto transition-transform',
                      isProjectsExpanded ? 'rotate-180' : '',
                    )}
                  ></div>
                </button>
                {isProjectsExpanded && connection.stats?.projects && connection.stats.projects.length > 0 ? (
                  <div className="grid gap-3">
                    {connection.stats.projects.map((project) => (
                      <a
                        key={project.id}
                        href={`https://dash.cloudflare.com/pages/view/${project.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-codinit-elements-textPrimary flex items-center gap-2">
                              <div className="i-ph:globe w-4 h-4 text-codinit-elements-borderColorActive"></div>
                              {project.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-2 text-xs text-codinit-elements-textSecondary">
                              {project.latest_deployment ? (
                                <>
                                  <a
                                    href={project.latest_deployment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-codinit-elements-borderColorActive"
                                  >
                                    {project.latest_deployment.url}
                                  </a>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <div className="i-ph:clock w-3 h-3"></div>
                                    {new Date(project.latest_deployment.created_on).toLocaleDateString()}
                                  </span>
                                </>
                              ) : (
                                <span>No deployments yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : isProjectsExpanded ? (
                  <div className="text-sm text-codinit-elements-textSecondary flex items-center gap-2">
                    <div className="i-ph:info w-4 h-4"></div>
                    No Pages projects found in your account
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-codinit-elements-textSecondary mb-2">API Token</label>
              <input
                type="password"
                value={connection.token}
                onChange={(e) => updateCloudflareConnection({ ...connection, token: e.target.value })}
                disabled={connecting}
                placeholder="Enter your Cloudflare API token"
                className={classNames(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                  'border border-[#E5E5E5] dark:border-[#333333]',
                  'text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary',
                  'focus:outline-none focus:ring-1 focus:ring-codinit-elements-borderColorActive',
                  'disabled:opacity-50',
                )}
              />
              <div className="mt-2 text-sm text-codinit-elements-textSecondary">
                <a
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-codinit-elements-borderColorActive hover:underline inline-flex items-center gap-1"
                >
                  Get your API token
                  <div className="i-ph:arrow-square-out w-4 h-4"></div>
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm text-codinit-elements-textSecondary mb-2">Account ID</label>
              <input
                type="text"
                value={connection.accountId}
                onChange={(e) => updateCloudflareConnection({ ...connection, accountId: e.target.value })}
                disabled={connecting}
                placeholder="Enter your Cloudflare Account ID"
                className={classNames(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                  'border border-[#E5E5E5] dark:border-[#333333]',
                  'text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary',
                  'focus:outline-none focus:ring-1 focus:ring-codinit-elements-borderColorActive',
                  'disabled:opacity-50',
                )}
              />
              <div className="mt-2 text-sm text-codinit-elements-textSecondary">
                <a
                  href="https://dash.cloudflare.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-codinit-elements-borderColorActive hover:underline inline-flex items-center gap-1"
                >
                  Find your Account ID
                  <div className="i-ph:arrow-square-out w-4 h-4"></div>
                </a>{' '}
                → Account Home → Account ID
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting || !connection.token || !connection.accountId}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                'bg-[#303030] text-white',
                'hover:bg-[#5E41D0] hover:text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
                'transform active:scale-95',
              )}
            >
              {connecting ? (
                <>
                  <div className="i-ph:spinner-gap animate-spin"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <div className="i-ph:plug-charging w-4 h-4"></div>
                  Connect
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
