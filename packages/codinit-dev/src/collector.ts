import { execSync } from 'child_process';
import { createHash } from 'crypto';
import type { BuildMetadata } from './types';

/**
 * Collects build metadata from the current environment
 */
export function collectBuildMetadata(): BuildMetadata {
  const isCI = process.env.CI === 'true';
  const isOfficialBuild = checkOfficialBuild();

  // Collect git information
  const commit = getGitCommit();
  const branch = getGitBranch();
  const tags = getGitTags();

  // Collect builder information
  const builder = getBuilderIdentity();
  const environment = getEnvironment();

  // Build timestamp
  const timestamp = new Date().toISOString();

  // CI build number if available
  const buildNumber = getBuildNumber();

  const metadata: BuildMetadata = {
    commit,
    branch,
    timestamp,
    builder,
    environment,
    isOfficial: isOfficialBuild,
    buildNumber,
    tags,
  };

  // Generate signature for official builds
  if (isOfficialBuild) {
    metadata.signature = generateSignature(metadata);
  }

  return metadata;
}

/**
 * Check if this is an official build based on environment variables
 */
function checkOfficialBuild(): boolean {
  // Check for official build marker environment variable
  if (process.env.OFFICIAL_BUILD === 'true') {
    return true;
  }

  // Check if running in trusted CI environments
  const trustedCIProviders = [
    process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY === 'Gerome-Elassaad/codinit-app',
    process.env.GITLAB_CI === 'true' && process.env.CI_PROJECT_PATH === 'Gerome-Elassaad/codinit-app',
    process.env.CLOUDFLARE_PAGES === 'true',
  ];

  return trustedCIProviders.some(Boolean);
}

/**
 * Get git commit hash
 */
function getGitCommit(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get git branch name
 */
function getGitBranch(): string {
  try {
    // Try environment variables first (CI systems)
    if (process.env.GITHUB_REF) {
      return process.env.GITHUB_REF.replace('refs/heads/', '');
    }
    if (process.env.CI_COMMIT_BRANCH) {
      return process.env.CI_COMMIT_BRANCH;
    }

    // Fallback to git command
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get git tags for current commit
 */
function getGitTags(): string[] {
  try {
    const tags = execSync('git tag --points-at HEAD', { encoding: 'utf-8' }).trim();
    return tags ? tags.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Get builder identity
 */
function getBuilderIdentity(): string {
  // GitHub Actions
  if (process.env.GITHUB_ACTIONS === 'true') {
    return `GitHub Actions (${process.env.GITHUB_ACTOR})`;
  }

  // GitLab CI
  if (process.env.GITLAB_CI === 'true') {
    return `GitLab CI (${process.env.GITLAB_USER_LOGIN})`;
  }

  // Cloudflare Pages
  if (process.env.CF_PAGES === '1') {
    return 'Cloudflare Pages';
  }

  // Local build
  try {
    const username = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    return `local (${username})`;
  } catch {
    return 'local (unknown)';
  }
}

/**
 * Get build environment
 */
function getEnvironment(): string {
  if (process.env.GITHUB_ACTIONS === 'true') return 'github-actions';
  if (process.env.GITLAB_CI === 'true') return 'gitlab-ci';
  if (process.env.CF_PAGES === '1') return 'cloudflare-pages';
  if (process.env.CI === 'true') return 'ci';
  return 'local';
}

/**
 * Get CI build number if available
 */
function getBuildNumber(): string | undefined {
  return (
    process.env.GITHUB_RUN_NUMBER ||
    process.env.CI_PIPELINE_IID ||
    process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ||
    undefined
  );
}

/**
 * Generate a signature for the build metadata
 * In a real implementation, this would use a private key
 * For now, we use a hash of the metadata + secret
 */
function generateSignature(metadata: BuildMetadata): string {
  const secret = process.env.BUILD_SIGNING_SECRET || 'default-secret-change-me';
  const data = JSON.stringify({
    commit: metadata.commit,
    branch: metadata.branch,
    timestamp: metadata.timestamp,
    builder: metadata.builder,
  });

  return createHash('sha256')
    .update(data + secret)
    .digest('hex');
}

/**
 * Verify a signature
 */
export function verifySignature(metadata: BuildMetadata, signature: string): boolean {
  const expectedSignature = generateSignature(metadata);
  return signature === expectedSignature;
}
