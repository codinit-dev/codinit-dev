import { z } from 'zod';
import type { AgentTool, ToolContext } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FileOperationTools');

export const readFileTool: AgentTool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  parameters: z.object({
    path: z.string().describe('The file path to read'),
    encoding: z.enum(['utf8', 'base64']).optional().default('utf8'),
  }),
  async execute(args: { path: string; encoding?: string }, context: ToolContext) {
    try {
      logger.info(`Reading file: ${args.path}`);

      const content = args.encoding
        ? await context.webcontainer.fs.readFile(args.path, args.encoding as 'utf8')
        : await context.webcontainer.fs.readFile(args.path);

      return {
        toolCallId: `read_file-${Date.now()}`,
        success: true,
        output: { path: args.path, content, encoding: args.encoding },
      };
    } catch (error: any) {
      logger.error(`Failed to read file ${args.path}:`, error);
      return {
        toolCallId: `read_file-${Date.now()}`,
        success: false,
        output: null,
        error: `Failed to read file: ${error.message}`,
      };
    }
  },
  timeout: 10000,
};

export const writeFileTool: AgentTool = {
  name: 'write_file',
  description: 'Write or update a file with new content',
  parameters: z.object({
    path: z.string().describe('The file path to write'),
    content: z.string().describe('The content to write to the file'),
  }),
  async execute(args: { path: string; content: string }, context: ToolContext) {
    try {
      logger.info(`Writing file: ${args.path}`);

      await context.webcontainer.fs.writeFile(args.path, args.content);

      return {
        toolCallId: `write_file-${Date.now()}`,
        success: true,
        output: { path: args.path, bytesWritten: args.content.length },
      };
    } catch (error: any) {
      logger.error(`Failed to write file ${args.path}:`, error);
      return {
        toolCallId: `write_file-${Date.now()}`,
        success: false,
        output: null,
        error: `Failed to write file: ${error.message}`,
      };
    }
  },
  timeout: 15000,
};

export const listFilesTool: AgentTool = {
  name: 'list_files',
  description: 'List files and directories at a given path',
  parameters: z.object({
    path: z.string().describe('The directory path to list').default('.'),
    recursive: z.boolean().describe('Whether to list recursively').optional().default(false),
  }),
  async execute(args: { path: string; recursive?: boolean }, context: ToolContext) {
    try {
      logger.info(`Listing files at: ${args.path}`);

      const listDir = async (dirPath: string, recursive: boolean = false): Promise<string[]> => {
        const entries = await context.webcontainer.fs.readdir(dirPath, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
          const fullPath = `${dirPath}/${entry.name}`.replace(/\/+/g, '/');

          if (entry.isDirectory()) {
            if (recursive) {
              const subFiles = await listDir(fullPath, true);
              files.push(...subFiles);
            } else {
              files.push(`${fullPath}/`);
            }
          } else {
            files.push(fullPath);
          }
        }

        return files;
      };

      const files = await listDir(args.path, args.recursive);

      return {
        toolCallId: `list_files-${Date.now()}`,
        success: true,
        output: { path: args.path, files, count: files.length },
      };
    } catch (error: any) {
      logger.error(`Failed to list files at ${args.path}:`, error);
      return {
        toolCallId: `list_files-${Date.now()}`,
        success: false,
        output: null,
        error: `Failed to list files: ${error.message}`,
      };
    }
  },
  timeout: 10000,
};

export const deleteFileTool: AgentTool = {
  name: 'delete_file',
  description: 'Delete a file or directory',
  parameters: z.object({
    path: z.string().describe('The file or directory path to delete'),
    recursive: z.boolean().describe('Whether to delete recursively for directories').optional().default(false),
  }),
  async execute(args: { path: string; recursive?: boolean }, context: ToolContext) {
    try {
      logger.info(`Deleting: ${args.path}`);

      try {
        // Try to read as directory first
        await context.webcontainer.fs.readdir(args.path);

        // If successful, it's a directory
        await context.webcontainer.fs.rm(args.path, { recursive: args.recursive });
      } catch {
        // If readdir fails, it's probably a file
        await context.webcontainer.fs.rm(args.path);
      }

      return {
        toolCallId: `delete_file-${Date.now()}`,
        success: true,
        output: { path: args.path, deleted: true },
      };
    } catch (error: any) {
      logger.error(`Failed to delete ${args.path}:`, error);
      return {
        toolCallId: `delete_file-${Date.now()}`,
        success: false,
        output: null,
        error: `Failed to delete: ${error.message}`,
      };
    }
  },
  timeout: 10000,
};

export const createDirectoryTool: AgentTool = {
  name: 'create_directory',
  description: 'Create a new directory',
  parameters: z.object({
    path: z.string().describe('The directory path to create'),
    recursive: z.boolean().describe('Whether to create parent directories').optional().default(true),
  }),
  async execute(args: { path: string; recursive?: boolean }, context: ToolContext) {
    try {
      logger.info(`Creating directory: ${args.path}`);

      if (args.recursive ?? true) {
        await context.webcontainer.fs.mkdir(args.path, { recursive: true });
      } else {
        await context.webcontainer.fs.mkdir(args.path);
      }

      return {
        toolCallId: `create_directory-${Date.now()}`,
        success: true,
        output: { path: args.path, created: true },
      };
    } catch (error: any) {
      logger.error(`Failed to create directory ${args.path}:`, error);
      return {
        toolCallId: `create_directory-${Date.now()}`,
        success: false,
        output: null,
        error: `Failed to create directory: ${error.message}`,
      };
    }
  },
  timeout: 5000,
};

export const fileExistsTool: AgentTool = {
  name: 'file_exists',
  description: 'Check if a file or directory exists',
  parameters: z.object({
    path: z.string().describe('The file or directory path to check'),
  }),
  async execute(args: { path: string }, context: ToolContext) {
    try {
      await context.webcontainer.fs.readFile(args.path);
      return {
        toolCallId: `file_exists-${Date.now()}`,
        success: true,
        output: { path: args.path, exists: true },
      };
    } catch {
      return {
        toolCallId: `file_exists-${Date.now()}`,
        success: true,
        output: { path: args.path, exists: false },
      };
    }
  },
  timeout: 5000,
};

export const fileOperationTools: AgentTool[] = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  deleteFileTool,
  createDirectoryTool,
  fileExistsTool,
];
