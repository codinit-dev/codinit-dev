import { json } from '@remix-run/cloudflare';
import JSZip from 'jszip';

interface CloudflareContext {
  cloudflare?: {
    env?: {
      CF_PAGES?: string;
      CF_PAGES_URL?: string;
      CF_PAGES_COMMIT_SHA?: string;
      GITHUB_TOKEN?: string;
    };
  };
}

interface GitHubRepoData {
  default_branch: string;
}

interface GitHubTreeItem {
  type: string;
  path: string;
  size: number;
}

interface GitHubTreeData {
  tree: GitHubTreeItem[];
}

interface GitHubContentData {
  content: string;
}

interface GitHubReleaseData {
  zipball_url: string;
}

interface FileItem {
  name: string;
  path: string;
  content: string;
}

/**
 * Constants for GitHub repository path handling
 */
const GITHUB_REPO_PATH_FORMAT = {
  /**
   * Basic format: "owner/repo"
   * Example: "facebook/react"
   */
  BASIC: 'owner/repo',

  /**
   * With subdirectory: "owner/repo/path/to/subdirectory"
   * Example: "vercel/next.js/examples/basic"
   */
  WITH_SUBDIRECTORY: 'owner/repo/path/to/subdirectory',
} as const;

/**
 * Configuration constants for file filtering and API handling
 */
const GITHUB_FETCH_CONFIG = {
  /**
   * Maximum file size for non-lock files (100KB)
   * Files larger than this will be skipped unless they are lock files
   */
  MAX_FILE_SIZE: 100000,

  /**
   * Number of files to fetch in parallel when using Contents API
   * Helps avoid overwhelming the GitHub API
   */
  BATCH_SIZE: 10,

  /**
   * Delay between batches in milliseconds
   * Adds rate limiting to be respectful to GitHub API
   */
  BATCH_DELAY_MS: 100,

  /**
   * Patterns for files that should be excluded
   */
  EXCLUDED_PATTERNS: {
    GIT_DIR: '.git/',
  },

  /**
   * Lock files that are allowed even if they exceed MAX_FILE_SIZE
   */
  ALLOWED_LOCK_FILES: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'] as readonly string[],
} as const;

/**
 * Interface for parsed GitHub repository information
 */
interface ParsedGitHubRepo {
  owner: string;
  repoName: string;
  repoPath: string; // "owner/repo" format for API calls
  subdirectory: string; // Empty string if no subdirectory, otherwise the path
  hasSubdirectory: boolean;
}

function normalizeGitHubRepoPath(repoInput: string): string {
  let normalized = repoInput.trim();

  // Remove .git suffix if present
  if (normalized.endsWith('.git')) {
    normalized = normalized.slice(0, -4);
  }

  // Check if it's a full GitHub URL and strip protocol/domain
  const githubUrlPattern = /^https?:\/\/github\.com\//i;

  if (githubUrlPattern.test(normalized)) {
    normalized = normalized.replace(githubUrlPattern, '');
  }

  return normalized;
}

function parseGitHubRepoPath(repoPath: string): ParsedGitHubRepo {
  const parts = repoPath.split('/');

  if (parts.length < 2) {
    throw new Error(
      `Invalid GitHub repository path: "${repoPath}". Expected format: "${GITHUB_REPO_PATH_FORMAT.BASIC}" or "${GITHUB_REPO_PATH_FORMAT.WITH_SUBDIRECTORY}"`,
    );
  }

  const owner = parts[0];
  const repoName = parts[1];
  const subdirectory = parts.slice(2).join('/'); // Everything after owner/repo

  return {
    owner,
    repoName,
    repoPath: `${owner}/${repoName}`,
    subdirectory,
    hasSubdirectory: subdirectory.length > 0,
  };
}

// Function to detect if we're running in Cloudflare
function isCloudflareEnvironment(context: CloudflareContext): boolean {
  // Check if we're in production AND have Cloudflare Pages specific env vars
  const isProduction = process.env.NODE_ENV === 'production';
  const hasCfPagesVars = !!(
    context?.cloudflare?.env?.CF_PAGES ||
    context?.cloudflare?.env?.CF_PAGES_URL ||
    context?.cloudflare?.env?.CF_PAGES_COMMIT_SHA
  );

  return isProduction && hasCfPagesVars;
}

// Cloudflare-compatible method using GitHub Contents API
async function fetchRepoContentsCloudflare(repo: string, githubToken?: string): Promise<(FileItem | null)[]> {
  const baseUrl = 'https://api.github.com';

  // Normalize the repository input (handles both URLs and paths)
  const normalizedRepo = normalizeGitHubRepoPath(repo);

  // Parse repository path using the helper function
  const { repoPath, subdirectory, hasSubdirectory } = parseGitHubRepoPath(normalizedRepo);

  console.log(
    `[GitHub Template] Fetching from repo: ${repoPath}${hasSubdirectory ? `, subdirectory: ${subdirectory}` : ' (root directory)'}`,
  );

  console.log(
    `[GitHub Template] GitHub Token (masked): ${githubToken ? githubToken.substring(0, 5) + '...' : 'Not provided'}`,
  );

  // Get repository info to find default branch
  const repoUrl = `${baseUrl}/repos/${repoPath}`;

  console.log(`[GitHub Template] Fetching repo info from: ${repoUrl}`);

  const repoResponse = await fetch(repoUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'CodinIT-App (https://codinit.dev)',
      ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
    },
  });

  if (!repoResponse.ok) {
    const errorText = await repoResponse.text();
    throw new Error(`GitHub API error (${repoResponse.status}): ${repoResponse.statusText} - ${errorText}`);
  }

  const repoData = (await repoResponse.json()) as GitHubRepoData;
  const defaultBranch = repoData.default_branch;

  // Get the tree recursively
  const treeUrl = `${baseUrl}/repos/${repoPath}/git/trees/${defaultBranch}?recursive=1`;

  console.log(`[GitHub Template] Fetching tree from: ${treeUrl}`);

  const treeResponse = await fetch(treeUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'CodinIT-App (https://codinit.dev)',
      ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
    },
  });

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`);
  }

  const treeData = (await treeResponse.json()) as GitHubTreeData;

  // Filter for files only (not directories) and limit size
  const files = treeData.tree.filter((item: GitHubTreeItem) => {
    if (item.type !== 'blob') {
      return false;
    }

    // If subdirectory is specified, only include files from that subdirectory
    if (subdirectory && !item.path.startsWith(`${subdirectory}/`)) {
      return false;
    }

    if (item.path.startsWith(GITHUB_FETCH_CONFIG.EXCLUDED_PATTERNS.GIT_DIR)) {
      return false;
    }

    // Allow lock files even if they're large
    const isLockFile = GITHUB_FETCH_CONFIG.ALLOWED_LOCK_FILES.some((lockFile) => item.path.endsWith(lockFile));

    // For non-lock files, limit size to configured maximum
    if (!isLockFile && item.size >= GITHUB_FETCH_CONFIG.MAX_FILE_SIZE) {
      return false;
    }

    return true;
  });

  // Fetch file contents in batches to avoid overwhelming the API
  const batchSize = GITHUB_FETCH_CONFIG.BATCH_SIZE;
  const fileContents: (FileItem | null)[] = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(async (file: GitHubTreeItem): Promise<FileItem | null> => {
      try {
        const contentResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${file.path}`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'CodinIT-App (https://codinit.dev)',
            ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
          },
        });

        if (!contentResponse.ok) {
          console.warn(`Failed to fetch ${file.path}: ${contentResponse.status}`);
          return null;
        }

        const contentData = (await contentResponse.json()) as GitHubContentData;
        const content = atob(contentData.content.replace(/\s/g, ''));

        // Strip subdirectory prefix from path if present
        let relativePath = file.path;

        if (subdirectory && file.path.startsWith(`${subdirectory}/`)) {
          relativePath = file.path.substring(subdirectory.length + 1);
        }

        return {
          name: relativePath.split('/').pop() || '',
          path: relativePath,
          content,
        };
      } catch (error) {
        console.warn(`Error fetching ${file.path}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    fileContents.push(...batchResults.filter(Boolean));

    // Add a small delay between batches to be respectful to the API
    if (i + batchSize < files.length) {
      await new Promise((resolve) => setTimeout(resolve, GITHUB_FETCH_CONFIG.BATCH_DELAY_MS));
    }
  }

  return fileContents;
}

// Your existing method for non-Cloudflare environments
async function fetchRepoContentsZip(repo: string, githubToken?: string): Promise<(FileItem | null)[]> {
  const baseUrl = 'https://api.github.com';

  // Normalize the repository input (handles both URLs and paths)
  const normalizedRepo = normalizeGitHubRepoPath(repo);

  // Parse repository path using the helper function
  const { repoPath, subdirectory, hasSubdirectory } = parseGitHubRepoPath(normalizedRepo);

  console.log(
    `[GitHub Template] Fetching ZIP from repo: ${repoPath}${hasSubdirectory ? `, subdirectory: ${subdirectory}` : ' (root directory)'}`,
  );

  console.log(
    `[GitHub Template] GitHub Token (masked): ${githubToken ? githubToken.substring(0, 5) + '...' : 'Not provided'}`,
  );

  // Get the latest release
  const releaseUrl = `${baseUrl}/repos/${repoPath}/releases/latest`;

  console.log(`[GitHub Template] Fetching release from: ${releaseUrl}`);

  const releaseResponse = await fetch(releaseUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'CodinIT-App (https://codinit.dev)',
      ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
    },
  });

  if (!releaseResponse.ok) {
    throw new Error(`GitHub API error: ${releaseResponse.status} - ${releaseResponse.statusText}`);
  }

  const releaseData = (await releaseResponse.json()) as GitHubReleaseData;
  const zipballUrl = releaseData.zipball_url;
  console.log(`[GitHub Template] Fetching zipball from: ${zipballUrl}`);

  // Fetch the zipball
  const zipResponse = await fetch(zipballUrl, {
    headers: {
      ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
    },
  });

  if (!zipResponse.ok) {
    throw new Error(`Failed to fetch release zipball: ${zipResponse.status}`);
  }

  // Get the zip content as ArrayBuffer
  const zipArrayBuffer = await zipResponse.arrayBuffer();

  // Use JSZip to extract the contents
  const zip = await JSZip.loadAsync(zipArrayBuffer);

  // Find the root folder name
  let rootFolderName = '';
  zip.forEach((relativePath) => {
    if (!rootFolderName && relativePath.includes('/')) {
      rootFolderName = relativePath.split('/')[0];
    }
  });

  // Extract all files
  const promises = Object.keys(zip.files).map(async (filename) => {
    const zipEntry = zip.files[filename];

    // Skip directories
    if (zipEntry.dir) {
      return null;
    }

    // Skip the root folder itself
    if (filename === rootFolderName) {
      return null;
    }

    // Remove the root folder from the path
    let normalizedPath = filename;

    if (rootFolderName && filename.startsWith(`${rootFolderName}/`)) {
      normalizedPath = filename.substring(rootFolderName.length + 1);
    }

    // If subdirectory is specified, only include files from that subdirectory
    if (subdirectory) {
      if (!normalizedPath.startsWith(`${subdirectory}/`)) {
        return null;
      }

      // Strip subdirectory prefix from path
      normalizedPath = normalizedPath.substring(subdirectory.length + 1);
    }

    // Skip .git files
    if (normalizedPath.startsWith(GITHUB_FETCH_CONFIG.EXCLUDED_PATTERNS.GIT_DIR)) {
      return null;
    }

    // Get the file content
    const content = await zipEntry.async('string');

    return {
      name: normalizedPath.split('/').pop() || '',
      path: normalizedPath,
      content,
    };
  });

  const results = await Promise.all(promises);

  return results.filter(Boolean);
}

export async function loader({ request, context }: { request: Request; context: CloudflareContext }) {
  const url = new URL(request.url);
  const repo = url.searchParams.get('repo');

  if (!repo) {
    return json({ error: 'Repository name is required' }, { status: 400 });
  }

  try {
    // Access environment variables from Cloudflare context or process.env
    const githubToken =
      context?.cloudflare?.env?.GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_ACCESS_TOKEN;

    let fileList: (FileItem | null)[];

    if (isCloudflareEnvironment(context)) {
      fileList = await fetchRepoContentsCloudflare(repo, githubToken);
    } else {
      // Try ZIP method first (requires releases), fallback to Contents API if it fails
      try {
        fileList = await fetchRepoContentsZip(repo, githubToken);
      } catch (zipError) {
        console.log('ZIP method failed, falling back to Contents API');
        console.log('Error:', zipError instanceof Error ? zipError.message : String(zipError));
        fileList = await fetchRepoContentsCloudflare(repo, githubToken);
      }
    }

    // Filter out .git files for both methods
    const filteredFiles = fileList.filter(
      (file): file is FileItem => file !== null && !file.path.startsWith(GITHUB_FETCH_CONFIG.EXCLUDED_PATTERNS.GIT_DIR),
    );

    return json(filteredFiles);
  } catch (error) {
    console.error('Error processing GitHub template:', error);
    console.error('Repository:', repo);
    console.error('Error details:', error instanceof Error ? error.message : String(error));

    return json(
      {
        error: 'Failed to fetch template files',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
