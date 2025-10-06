import React from 'react';
import { Button } from '~/components/ui/Button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '~/components/ui/Collapsible';
import { classNames } from '~/utils/classNames';
import { useGitHubStats } from '~/lib/hooks';
import type { GitHubConnection, GitHubStats as GitHubStatsType } from '~/types/GitHub';
import { GitHubErrorBoundary } from './GitHubErrorBoundary';

interface GitHubStatsProps {
  connection: GitHubConnection;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export function GitHubStats({ connection, isExpanded, onToggleExpanded }: GitHubStatsProps) {
  const { stats, isLoading, isRefreshing, refreshStats, isStale } = useGitHubStats(
    connection,
    {
      autoFetch: true,
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
    },
    !connection?.token,
  ); // Use server-side if no token

  return (
    <GitHubErrorBoundary>
      <GitHubStatsContent
        stats={stats}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        refreshStats={refreshStats}
        isStale={isStale}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
      />
    </GitHubErrorBoundary>
  );
}

function GitHubStatsContent({
  stats,
  isLoading,
  isRefreshing,
  refreshStats,
  isStale,
  isExpanded,
  onToggleExpanded,
}: {
  stats: GitHubStatsType | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshStats: () => Promise<void>;
  isStale: boolean;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}) {
  if (!stats) {
    return (
      <div className="mt-6 border-t border-codinit-elements-borderColor dark:border-codinit-elements-borderColor pt-6">
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
                <span className="text-codinit-elements-textSecondary">Loading GitHub stats...</span>
              </>
            ) : (
              <span className="text-codinit-elements-textSecondary">No stats available</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-codinit-elements-borderColor dark:border-codinit-elements-borderColor pt-6">
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 rounded-lg bg-codinit-elements-background dark:bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive/70 dark:hover:border-codinit-elements-borderColorActive/70 transition-all duration-200">
            <div className="flex items-center gap-2">
              <div className="i-ph:chart-bar w-4 h-4 text-codinit-elements-item-contentAccent" />
              <span className="text-sm font-medium text-codinit-elements-textPrimary">
                GitHub Stats
                {isStale && <span className="text-codinit-elements-textTertiary ml-1">(Stale)</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  refreshStats();
                }}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isRefreshing ? (
                  <>
                    <div className="i-ph:spinner-gap w-3 h-3 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <div className="i-ph:arrows-clockwise w-3 h-3" />
                    Refresh
                  </>
                )}
              </Button>
              <div
                className={classNames(
                  'i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-codinit-elements-textSecondary',
                  isExpanded ? 'rotate-180' : '',
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden">
          <div className="space-y-4 mt-4">
            {/* Languages Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-codinit-elements-textPrimary mb-3">Top Languages</h4>
              {stats.mostUsedLanguages && stats.mostUsedLanguages.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {stats.mostUsedLanguages.slice(0, 15).map(({ language, bytes, repos }) => (
                      <span
                        key={language}
                        className="px-3 py-1 text-xs rounded-full bg-codinit-elements-sidebar-buttonBackgroundDefault text-codinit-elements-sidebar-buttonText"
                        title={`${language}: ${(bytes / 1024 / 1024).toFixed(2)}MB across ${repos} repos`}
                      >
                        {language} ({repos})
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-codinit-elements-textSecondary">
                    Based on actual codebase size across repositories
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.languages)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([language]) => (
                      <span
                        key={language}
                        className="px-3 py-1 text-xs rounded-full bg-codinit-elements-sidebar-buttonBackgroundDefault text-codinit-elements-sidebar-buttonText"
                      >
                        {language}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* GitHub Overview Summary */}
            <div className="mb-6 p-4 bg-codinit-elements-background-depth-1 rounded-lg border border-codinit-elements-borderColor">
              <h4 className="text-sm font-medium text-codinit-elements-textPrimary mb-3">GitHub Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-codinit-elements-textPrimary">
                    {(stats.publicRepos || 0) + (stats.privateRepos || 0)}
                  </div>
                  <div className="text-xs text-codinit-elements-textSecondary">Total Repositories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-codinit-elements-textPrimary">{stats.totalBranches || 0}</div>
                  <div className="text-xs text-codinit-elements-textSecondary">Total Branches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-codinit-elements-textPrimary">
                    {stats.organizations?.length || 0}
                  </div>
                  <div className="text-xs text-codinit-elements-textSecondary">Organizations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-codinit-elements-textPrimary">
                    {Object.keys(stats.languages).length}
                  </div>
                  <div className="text-xs text-codinit-elements-textSecondary">Languages Used</div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-codinit-elements-textPrimary mb-2">Activity Summary</h5>
              <div className="grid grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Branches',
                    value: stats.totalBranches || 0,
                    icon: 'i-ph:git-branch',
                    iconColor: 'text-codinit-elements-icon-info',
                  },
                  {
                    label: 'Contributors',
                    value: stats.totalContributors || 0,
                    icon: 'i-ph:users',
                    iconColor: 'text-codinit-elements-icon-success',
                  },
                  {
                    label: 'Issues',
                    value: stats.totalIssues || 0,
                    icon: 'i-ph:circle',
                    iconColor: 'text-codinit-elements-icon-warning',
                  },
                  {
                    label: 'Pull Requests',
                    value: stats.totalPullRequests || 0,
                    icon: 'i-ph:git-pull-request',
                    iconColor: 'text-codinit-elements-icon-accent',
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="flex flex-col p-3 rounded-lg bg-codinit-elements-background-depth-2 dark:bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor"
                  >
                    <span className="text-xs text-codinit-elements-textSecondary">{stat.label}</span>
                    <span className="text-lg font-medium text-codinit-elements-textPrimary flex items-center gap-1">
                      <div className={`${stat.icon} w-4 h-4 ${stat.iconColor}`} />
                      {stat.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizations Section */}
            {stats.organizations && stats.organizations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-codinit-elements-textPrimary mb-2">Organizations</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stats.organizations.map((org) => (
                    <a
                      key={org.login}
                      href={org.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-codinit-elements-background-depth-2 dark:bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor dark:border-codinit-elements-borderColor hover:border-codinit-elements-borderColorActive dark:hover:border-codinit-elements-borderColorActive transition-all duration-200"
                    >
                      <img
                        src={org.avatar_url}
                        alt={org.login}
                        className="w-8 h-8 rounded-full border border-codinit-elements-borderColor"
                      />
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-medium text-codinit-elements-textPrimary truncate">
                          {org.name || org.login}
                        </h6>
                        <p className="text-xs text-codinit-elements-textSecondary truncate">{org.login}</p>
                        {org.description && (
                          <p className="text-xs text-codinit-elements-textTertiary truncate">{org.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-codinit-elements-textSecondary">
                        {org.public_repos && (
                          <span className="flex items-center gap-1">
                            <div className="i-ph:folder w-3 h-3" />
                            {org.public_repos}
                          </span>
                        )}
                        {org.followers && (
                          <span className="flex items-center gap-1">
                            <div className="i-ph:users w-3 h-3" />
                            {org.followers}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="pt-2 border-t border-codinit-elements-borderColor">
              <span className="text-xs text-codinit-elements-textSecondary">
                Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
