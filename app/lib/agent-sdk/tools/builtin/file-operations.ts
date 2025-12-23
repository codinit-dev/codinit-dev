import { z } from 'zod';
import type { AgentTool, ToolContext, ToolResult } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FileOperationTools');

const createTool = (
  name: string,
  description: string,
  parameters: z.ZodSchema,
  execute: (args: any, context: ToolContext) => Promise<any>,
  timeout = 10000,
): AgentTool => ({
  name,
  description,
  parameters,
  async execute(args: any, context: ToolContext): Promise<ToolResult> {
    try {
      const output = await execute(args, context);
      return {
        toolCallId: `${name}-${Date.now()}`,
        success: true,
        output,
      };
    } catch (error: any) {
      logger.error(`${name} failed:`, error);
      return {
        toolCallId: `${name}-${Date.now()}`,
        success: false,
        output: null,
        error: error.message,
      };
    }
  },
  timeout,
});

export const readFileTool = createTool(
  'read_file',
  'Read the contents of a file',
  z.object({
    path: z.string().describe('The file path to read'),
    encoding: z.enum(['utf8', 'base64']).optional().default('utf8'),
  }),
  async (args, ctx) => {
    logger.info(`Reading file: ${args.path}`);

    const content = await ctx.webcontainer.fs.readFile(args.path, args.encoding as 'utf8');

    return { path: args.path, content, encoding: args.encoding };
  },
);

export const writeFileTool = createTool(
  'write_file',
  'Write or update a file with new content',
  z.object({
    path: z.string().describe('The file path to write'),
    content: z.string().describe('The content to write to the file'),
  }),
  async (args, ctx) => {
    logger.info(`Writing file: ${args.path}`);
    await ctx.webcontainer.fs.writeFile(args.path, args.content);

    return { path: args.path, bytesWritten: args.content.length };
  },
  15000,
);

export const listFilesTool = createTool(
  'list_files',
  'List files and directories at a given path',
  z.object({
    path: z.string().describe('The directory path to list').default('.'),
    recursive: z.boolean().describe('Whether to list recursively').optional().default(false),
  }),
  async (args, ctx) => {
    logger.info(`Listing files at: ${args.path}`);

    const listDir = async (dirPath: string, recursive = false): Promise<string[]> => {
      const entries = await ctx.webcontainer.fs.readdir(dirPath, { withFileTypes: true });
      const files: string[] = [];

      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`.replace(/\/+/g, '/');

        if (entry.isDirectory()) {
          if (recursive) {
            files.push(...(await listDir(fullPath, true)));
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

    return { path: args.path, files, count: files.length };
  },
);

export const deleteFileTool = createTool(
  'delete_file',
  'Delete a file or directory',
  z.object({
    path: z.string().describe('The file or directory path to delete'),
    recursive: z.boolean().describe('Whether to delete recursively for directories').optional().default(false),
  }),
  async (args, ctx) => {
    logger.info(`Deleting: ${args.path}`);

    try {
      await ctx.webcontainer.fs.readdir(args.path);
      await ctx.webcontainer.fs.rm(args.path, { recursive: args.recursive });
    } catch {
      await ctx.webcontainer.fs.rm(args.path);
    }

    return { path: args.path, deleted: true };
  },
);

export const createDirectoryTool = createTool(
  'create_directory',
  'Create a new directory',
  z.object({
    path: z.string().describe('The directory path to create'),
    recursive: z.boolean().describe('Whether to create parent directories').optional().default(true),
  }),
  async (args, ctx) => {
    logger.info(`Creating directory: ${args.path}`);
    await ctx.webcontainer.fs.mkdir(args.path, { recursive: args.recursive ?? true });

    return { path: args.path, created: true };
  },
  5000,
);

export const fileExistsTool = createTool(
  'file_exists',
  'Check if a file or directory exists',
  z.object({
    path: z.string().describe('The file or directory path to check'),
  }),
  async (args, ctx) => {
    try {
      await ctx.webcontainer.fs.readFile(args.path);
      return { path: args.path, exists: true };
    } catch {
      return { path: args.path, exists: false };
    }
  },
  5000,
);

export const fileOperationTools: AgentTool[] = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  deleteFileTool,
  createDirectoryTool,
  fileExistsTool,
];
