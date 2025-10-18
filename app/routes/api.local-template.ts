import { json } from '@remix-run/cloudflare';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

interface FileItem {
  name: string;
  path: string;
  content: string;
}

interface LocalTemplateContext {
  // This runs on the server/build process, so we can use Node.js APIs
}

/**
 * Recursively reads all files from a directory
 */
async function readDirectoryRecursive(dirPath: string, basePath: string = ''): Promise<FileItem[]> {
  const files: FileItem[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      // Skip .git directories
      if (entry.name === '.git' || relativePath.startsWith('.git/')) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively read subdirectories
        const subFiles = await readDirectoryRecursive(fullPath, relativePath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Check file size
        const stats = await stat(fullPath);

        // Allow lock files even if they're large
        const isLockFile =
          entry.name === 'package-lock.json' || entry.name === 'yarn.lock' || entry.name === 'pnpm-lock.yaml';

        // For non-lock files, limit size to 100KB
        if (!isLockFile && stats.size >= 100000) {
          console.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
          continue;
        }

        try {
          // Read file content
          const content = await readFile(fullPath, 'utf-8');

          files.push({
            name: entry.name,
            path: relativePath,
            content,
          });
        } catch (error) {
          console.warn(`Failed to read file ${relativePath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }

  return files;
}

/**
 * Loader function for the local template API endpoint
 * Reads template files from the local templates directory
 */
export async function loader({ request }: { request: Request; context?: LocalTemplateContext }) {
  const url = new URL(request.url);
  const templateName = url.searchParams.get('template');

  if (!templateName) {
    return json({ error: 'Template name is required' }, { status: 400 });
  }

  try {
    /*
     * Get the templates directory path
     * In production (Cloudflare), this won't work, so we'll need a fallback
     */
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev) {
      // In production, templates should be bundled or fetched from GitHub
      return json(
        {
          error: 'Local templates only available in development mode',
          details: 'Please use GitHub template loading in production',
        },
        { status: 503 },
      );
    }

    // Construct the path to the template directory
    const templatesDir = join(process.cwd(), 'templates', templateName);

    // Check if directory exists
    try {
      const stats = await stat(templatesDir);

      if (!stats.isDirectory()) {
        return json({ error: `Template ${templateName} is not a directory` }, { status: 404 });
      }
    } catch {
      return json({ error: `Template ${templateName} not found` }, { status: 404 });
    }

    // Read all files from the template directory
    const files = await readDirectoryRecursive(templatesDir);

    return json(files);
  } catch (error) {
    console.error('Error processing local template:', error);
    console.error('Template:', templateName);
    console.error('Error details:', error instanceof Error ? error.message : String(error));

    return json(
      {
        error: 'Failed to load template files',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
