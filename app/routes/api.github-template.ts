import { json } from '@remix-run/cloudflare';
import JSZip from 'jszip';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const repo = url.searchParams.get('repo');

  if (!repo) {
    return json({ error: 'Repository name is required' }, { status: 400 });
  }

  try {
    const baseUrl = 'https://api.github.com';

    // Get repository info to find the default branch
    const repoResponse = await fetch(`${baseUrl}/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',

        // Add GitHub token if available in environment variables
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });

    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }

    const repoData = (await repoResponse.json()) as any;
    const defaultBranch = repoData.default_branch || 'main';

    // Construct zipball URL for the default branch
    const zipballUrl = `${baseUrl}/repos/${repo}/zipball/${defaultBranch}`;

    // Fetch the zipball
    const zipResponse = await fetch(zipballUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });

    if (!zipResponse.ok) {
      throw new Error(`Failed to fetch repository zipball: ${zipResponse.status}`);
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

      if (rootFolderName && filename.startsWith(rootFolderName + '/')) {
        normalizedPath = filename.substring(rootFolderName.length + 1);
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
    const fileList = results.filter(Boolean) as {
      name: string;
      path: string;
      content: string;
    }[];

    return json(fileList);
  } catch (error) {
    console.error('Error processing GitHub template:', error);
    return json({ error: 'Failed to fetch template files' }, { status: 500 });
  }
}
