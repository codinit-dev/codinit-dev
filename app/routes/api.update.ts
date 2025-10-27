import { json, type ActionFunction } from '@remix-run/cloudflare';

// Current version from package.json
const CURRENT_VERSION = '1.0.1';
const GITHUB_REPO = 'Gerome-Elassaad/codinit-app'; // Update this with your actual GitHub repo

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body: string;
  published_at: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Fetch the latest release from GitHub
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CodinIT-App',
      },
    });

    if (!response.ok) {
      // If no releases found or repo doesn't exist
      if (response.status === 404) {
        return json({
          updateAvailable: false,
          currentVersion: CURRENT_VERSION,
          message: 'No releases found. You are running the latest development version.',
        });
      }

      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = (await response.json()) as GitHubRelease;
    const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

    // Compare versions
    const updateAvailable = compareVersions(latestVersion, CURRENT_VERSION) > 0;

    return json({
      updateAvailable,
      currentVersion: CURRENT_VERSION,
      latestVersion,
      releaseUrl: release.html_url,
      releaseNotes: release.body,
      publishedAt: release.published_at,
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    return json(
      {
        error: 'Failed to check for updates',
        currentVersion: CURRENT_VERSION,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
};

/**
 * Compare two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

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
