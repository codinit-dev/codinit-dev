import type { WebContainer } from '@webcontainer/api';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('RepoTools');

export interface ReadFileArgs {
  filePath: string;
  query?: string;
  startLine?: number;
  endLine?: number;
  taskNameActive: string;
  taskNameComplete: string;
}

export interface LSRepoArgs {
  path?: string;
  globPattern?: string;
  ignore?: string[];
  taskNameActive: string;
  taskNameComplete: string;
}

export interface GrepRepoArgs {
  pattern: string;
  globPattern?: string;
  path?: string;
  taskNameActive: string;
  taskNameComplete: string;
}

export async function readFile(webcontainer: WebContainer, args: ReadFileArgs) {
  logger.info('Reading file:', args.filePath);

  try {
    const content = await webcontainer.fs.readFile(args.filePath, 'utf-8');
    const lines = content.split('\n');

    if (args.startLine !== undefined && args.endLine !== undefined) {
      const selectedLines = lines.slice(args.startLine - 1, args.endLine);
      return {
        filePath: args.filePath,
        content: selectedLines.join('\n'),
        totalLines: lines.length,
        returnedLines: selectedLines.length,
        startLine: args.startLine,
        endLine: args.endLine,
      };
    }

    if (lines.length > 2000) {
      logger.warn(`File ${args.filePath} has ${lines.length} lines, truncating to first 2000`);
      return {
        filePath: args.filePath,
        content: lines.slice(0, 2000).join('\n'),
        totalLines: lines.length,
        returnedLines: 2000,
        truncated: true,
        message: 'File too large, showing first 2000 lines. Use startLine/endLine to read specific sections.',
      };
    }

    return {
      filePath: args.filePath,
      content,
      totalLines: lines.length,
      returnedLines: lines.length,
    };
  } catch (error) {
    logger.error('Error reading file:', error);
    throw new Error(
      `Failed to read file ${args.filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function lsRepo(webcontainer: WebContainer, args: LSRepoArgs) {
  logger.info('Listing files in:', args.path || '/');

  try {
    const basePath = args.path || '/';
    const files = await listFilesRecursive(webcontainer, basePath, args.globPattern, args.ignore);

    const sortedFiles = files.sort((a, b) => a.localeCompare(b));

    if (sortedFiles.length > 200) {
      logger.warn(`Found ${sortedFiles.length} files, truncating to first 200`);
      return {
        path: basePath,
        files: sortedFiles.slice(0, 200),
        totalFiles: sortedFiles.length,
        truncated: true,
        message: 'Too many files, showing first 200. Use a more specific path or glob pattern.',
      };
    }

    return {
      path: basePath,
      files: sortedFiles,
      totalFiles: sortedFiles.length,
    };
  } catch (error) {
    logger.error('Error listing files:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function listFilesRecursive(
  webcontainer: WebContainer,
  path: string,
  globPattern?: string,
  ignore?: string[],
  results: string[] = [],
): Promise<string[]> {
  try {
    const entries = await webcontainer.fs.readdir(path, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;

      if (shouldIgnore(fullPath, ignore)) {
        continue;
      }

      if (entry.isDirectory()) {
        await listFilesRecursive(webcontainer, fullPath, globPattern, ignore, results);
      } else if (entry.isFile()) {
        if (!globPattern || matchesGlob(fullPath, globPattern)) {
          results.push(fullPath);
        }
      }
    }

    return results;
  } catch (error) {
    logger.warn(`Cannot read directory ${path}:`, error);
    return results;
  }
}

function shouldIgnore(path: string, ignore?: string[]): boolean {
  if (!ignore || ignore.length === 0) {
    const defaultIgnore = ['node_modules', '.git', 'dist', 'build', '.next', '.turbo'];
    return defaultIgnore.some((pattern) => path.includes(`/${pattern}/`) || path.endsWith(`/${pattern}`));
  }

  return ignore.some((pattern) => {
    if (pattern.includes('*')) {
      return matchesGlob(path, pattern);
    }

    return path.includes(`/${pattern}/`) || path.endsWith(`/${pattern}`);
  });
}

function matchesGlob(path: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);

  return regex.test(path);
}

export async function grepRepo(webcontainer: WebContainer, args: GrepRepoArgs) {
  logger.info('Searching for pattern:', args.pattern);

  try {
    const basePath = args.path || '/';
    const files = await listFilesRecursive(webcontainer, basePath, args.globPattern);

    const matches: Array<{
      file: string;
      line: number;
      content: string;
    }> = [];

    const regex = new RegExp(args.pattern, 'i');

    for (const file of files) {
      try {
        const content = await webcontainer.fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (regex.test(line)) {
            matches.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        });

        if (matches.length >= 200) {
          break;
        }
      } catch {
        continue;
      }
    }

    if (matches.length > 200) {
      return {
        pattern: args.pattern,
        matches: matches.slice(0, 200),
        totalMatches: matches.length,
        truncated: true,
        message: 'Too many matches, showing first 200. Use a more specific pattern or glob.',
      };
    }

    return {
      pattern: args.pattern,
      matches,
      totalMatches: matches.length,
    };
  } catch (error) {
    logger.error('Error searching files:', error);
    throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
