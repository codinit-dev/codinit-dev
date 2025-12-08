export interface UpdateCheckResult {
  available: boolean;
  version: string;
  currentVersion: string;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt?: string;
  error?: {
    type: 'rate_limit' | 'network' | 'auth' | 'unknown';
    message: string;
  };
}

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body: string;
  published_at: string;
}

interface ApiUpdateResponse {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
  error?: string;
  message?: string;
}

function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const version1 = v1.replace(/^v/, '');
  const version2 = v2.replace(/^v/, '');

  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) {
      return 1;
    }

    if (part1 < part2) {
      return -1;
    }
  }

  return 0;
}

export const checkForUpdates = async (): Promise<UpdateCheckResult> => {
  try {
    // Get update info from the API route
    const apiResponse = await fetch('/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    const apiData = (await apiResponse.json()) as ApiUpdateResponse;

    if (apiData.error) {
      throw new Error(apiData.message || 'API returned an error');
    }

    const currentVersion = apiData.currentVersion;

    // Fetch the latest release from GitHub
    const response = await fetch(`https://api.github.com/repos/codinit-dev/codinit-dev/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'codinit-dev',
      },
    });

    if (!response.ok) {
      // If no releases found or repo doesn't exist
      if (response.status === 404) {
        return {
          available: false,
          version: currentVersion,
          currentVersion,
        };
      }

      // Check for rate limiting
      if (response.status === 403) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        return {
          available: false,
          version: currentVersion,
          currentVersion,
          error: {
            type: 'rate_limit',
            message: `GitHub API rate limit exceeded. ${resetTime ? `Resets at ${new Date(parseInt(resetTime) * 1000).toLocaleTimeString()}` : ''}`,
          },
        };
      }

      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = (await response.json()) as GitHubRelease;
    const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

    // Compare versions
    const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      available: updateAvailable,
      version: latestVersion,
      currentVersion,
      releaseNotes: release.body,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);

    // Determine error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isNetworkError =
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('fetch') ||
      errorMessage.toLowerCase().includes('failed to fetch');

    let errorType: 'rate_limit' | 'network' | 'auth' | 'unknown' = 'unknown';

    if (isNetworkError) {
      errorType = 'network';
    } else if (errorMessage.toLowerCase().includes('rate limit')) {
      errorType = 'rate_limit';
    } else if (errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('403')) {
      errorType = 'auth';
    }

    return {
      available: false,
      version: 'unknown',
      currentVersion: 'unknown',
      error: {
        type: errorType,
        message: `Failed to check for updates: ${errorMessage}`,
      },
    };
  }
};

export const acknowledgeUpdate = async (version: string): Promise<void> => {
  // Store the acknowledged version in localStorage
  try {
    localStorage.setItem('last_acknowledged_update', version);
  } catch (error) {
    console.error('Failed to store acknowledged version:', error);
  }
};
