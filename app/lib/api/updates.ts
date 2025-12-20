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

export const checkForUpdates = async (): Promise<UpdateCheckResult> => {
  try {
    const apiResponse = await fetch('/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      if (apiResponse.status === 403) {
        const resetTime = apiResponse.headers.get('X-RateLimit-Reset');

        return {
          available: false,
          version: 'unknown',
          currentVersion: 'unknown',
          error: {
            type: 'rate_limit',
            message: `GitHub API rate limit exceeded. ${resetTime ? `Resets at ${new Date(parseInt(resetTime) * 1000).toLocaleTimeString()}` : 'Try again later.'}`,
          },
        };
      }

      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    const apiData = (await apiResponse.json()) as ApiUpdateResponse;

    if (apiData.error) {
      const errorMessage = apiData.message || 'API returned an error';
      let errorType: 'rate_limit' | 'network' | 'auth' | 'unknown' = 'unknown';

      if (errorMessage.toLowerCase().includes('rate limit')) {
        errorType = 'rate_limit';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        errorType = 'network';
      } else if (errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('403')) {
        errorType = 'auth';
      }

      return {
        available: false,
        version: apiData.currentVersion,
        currentVersion: apiData.currentVersion,
        error: {
          type: errorType,
          message: errorMessage,
        },
      };
    }

    return {
      available: apiData.updateAvailable,
      version: apiData.latestVersion || apiData.currentVersion,
      currentVersion: apiData.currentVersion,
      releaseNotes: apiData.releaseNotes,
      releaseUrl: apiData.releaseUrl,
      publishedAt: apiData.publishedAt,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);

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
