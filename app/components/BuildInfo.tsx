import { memo } from 'react';

/**
 * BuildInfo Component
 *
 * Displays build verification information to users.
 * Shows whether the build is official and provides build metadata.
 *
 * Usage:
 * ```tsx
 * import { BuildInfo } from '~/components/BuildInfo';
 * import { BUILD_METADATA } from '~/utils/build-info'; // Import after build
 *
 * // In your component
 * <BuildInfo metadata={BUILD_METADATA} />
 *
 * // Or with custom styling
 * <BuildInfo metadata={BUILD_METADATA} className="custom-class" showDetailed />
 * ```
 *
 * Note: BUILD_METADATA is only available after running a build.
 * For development, you can conditionally render or pass undefined.
 */

export interface BuildMetadata {
  commit: string;
  branch: string;
  timestamp: string;
  builder: string;
  environment: string;
  isOfficial: boolean;
  buildNumber?: string;
  tags?: string[];
  signature?: string;
}

interface BuildInfoProps {
  metadata?: BuildMetadata;
  className?: string;
  showDetailed?: boolean;
}

export const BuildInfo = memo(({ metadata, className, showDetailed = false }: BuildInfoProps) => {
  if (!metadata) {
    return null;
  }

  const { commit, branch, timestamp, builder, isOfficial, buildNumber, tags } = metadata;

  if (!commit) {
    return null;
  }

  const buildDate = new Date(timestamp);
  const shortCommit = commit.slice(0, 7);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {isOfficial ? (
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span className="font-medium">Official Build</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="text-amber-600 dark:text-amber-400">⚠</span>
            <span className="font-medium">Unofficial Build</span>
          </span>
        )}

        <span className="text-xs text-codinit-elements-textSecondary">{shortCommit}</span>

        {buildNumber && <span className="text-xs text-codinit-elements-textSecondary">#{buildNumber}</span>}
      </div>

      {showDetailed && (
        <div className="mt-2 text-xs text-codinit-elements-textSecondary space-y-1">
          <div>
            <span className="font-medium">Branch:</span> {branch}
          </div>
          <div>
            <span className="font-medium">Built:</span> {buildDate.toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Builder:</span> {builder}
          </div>
          {tags && tags.length > 0 && (
            <div>
              <span className="font-medium">Tags:</span> {tags.join(', ')}
            </div>
          )}
          {!isOfficial && (
            <div className="mt-2 text-amber-600 dark:text-amber-400">
              This is an unofficial build. For verified official releases, visit{' '}
              <a
                href="https://github.com/Gerome-Elassaad/codinit-app/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                GitHub Releases
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BuildInfo.displayName = 'BuildInfo';
