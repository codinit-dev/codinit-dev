import type { Message } from 'ai';
import ignore from 'ignore';
import { generateId } from '~/utils/fileUtils';
import { detectProjectCommands, type ProjectCommands, escapeCodinitTags } from '~/utils/projectCommands';
import { selectStarterTemplate, getTemplates } from '~/utils/selectStarterTemplate';
import type { ProviderInfo } from '~/types/model';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/pnpm-lock.yaml*',
  '**/package-lock.json*',
  '**/*lock.yaml',
];

// Type definitions
export interface InitFromTemplateOptions {
  message: string;
  model: string;
  provider: ProviderInfo;
  autoSelectTemplate: boolean;
  forceTemplate?: string; // Optional: force a specific template instead of auto-selecting
}

export interface InitFromTemplateResult {
  messages: Message[];
  template: string;
}

export interface InitFromGitRepoOptions {
  repoUrl: string;
  workdir: string;
  fileData: Record<string, { data: string | Uint8Array; encoding: string }>;
}

export interface InitFromFolderOptions {
  files: File[];
  binaryFiles: string[];
  folderName: string;
}

export interface InitResult {
  messages: Message[];
  commands: ProjectCommands;
}

// Helper functions
function createFilesArtifact(files: Array<{ path: string; content: string }>, title: string, id: string): string {
  return `<codinitArtifact id="${id}" title="${title}" type="bundled">
${files
  .map(
    (file) =>
      `<codinitAction type="file" filePath="${file.path}">
${escapeCodinitTags(file.content)}
</codinitAction>`,
  )
  .join('\n')}
</codinitArtifact>`;
}

function createCommandsArtifact(commands: ProjectCommands, id: string): string {
  let commandString = '';

  if (commands.setupCommand) {
    commandString += `
<codinitAction type="shell">${commands.setupCommand}</codinitAction>`;
  }

  if (commands.startCommand) {
    commandString += `
<codinitAction type="start">${commands.startCommand}</codinitAction>`;
  }

  return `${commands.followupMessage ? `\n\n${commands.followupMessage}` : ''}
<codinitArtifact id="${id}" title="Project Setup">
${commandString}
</codinitArtifact>`;
}

/**
 * Handles template selection and loading for chat-initiated builds
 */
export async function initFromTemplate(options: InitFromTemplateOptions): Promise<InitFromTemplateResult | null> {
  const { message, model, provider, autoSelectTemplate, forceTemplate } = options;

  // If autoSelectTemplate is false and no forced template, return null
  if (!autoSelectTemplate && !forceTemplate) {
    return null;
  }

  let template: string;
  let title: string;

  // If forceTemplate is provided, use it directly
  if (forceTemplate) {
    template = forceTemplate;
    title = 'Project Setup';
  } else {
    // Call selectStarterTemplate for auto-selection
    const selected = await selectStarterTemplate({
      message,
      model,
      provider,
    });
    template = selected.template;
    title = selected.title;
  }

  // If template is 'blank', return null
  if (template === 'blank') {
    return null;
  }

  // Fetch template files from GitHub
  let temResp;

  try {
    temResp = await getTemplates(template, title);
  } catch (error: any) {
    // Log warning and return null
    console.warn('Failed to fetch template:', error);
    throw error; // Re-throw to let caller handle with toast
  }

  if (!temResp) {
    return null;
  }

  const { assistantMessage, userMessage } = temResp;

  // Create standardized 3-message array
  const messages: Message[] = [
    {
      id: generateId(),
      role: 'user',
      content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${message}`,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      role: 'assistant',
      content: assistantMessage,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      role: 'user',
      content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userMessage}`,
      annotations: ['hidden'],
      createdAt: new Date(),
    },
  ];

  return { messages, template };
}

/**
 * Handles git repository import initialization
 */
export async function initFromGitRepo(options: InitFromGitRepoOptions): Promise<InitResult> {
  const { repoUrl, workdir, fileData } = options;

  // Filter files using IGNORE_PATTERNS
  const ig = ignore().add(IGNORE_PATTERNS);
  const filePaths = Object.keys(fileData).filter((filePath) => !ig.ignores(filePath));

  // Decode file contents
  const textDecoder = new TextDecoder('utf-8');
  const fileContents = filePaths
    .map((filePath) => {
      const { data: content, encoding } = fileData[filePath];
      return {
        path: filePath,
        content:
          encoding === 'utf8' ? (content as string) : content instanceof Uint8Array ? textDecoder.decode(content) : '',
      };
    })
    .filter((f) => f.content);

  // Detect project commands
  const commands = await detectProjectCommands(fileContents);

  // Create standardized message array
  const messages: Message[] = [];

  // 1. Assistant message with files
  messages.push({
    id: generateId(),
    role: 'assistant',
    content: `Cloning the repo ${repoUrl} into ${workdir}
${createFilesArtifact(fileContents, 'Git Cloned Files', 'imported-files')}`,
    createdAt: new Date(),
  });

  // 2-3. If commands exist, add user trigger + assistant commands
  if (commands.setupCommand || commands.startCommand) {
    messages.push({
      id: generateId(),
      role: 'user',
      content: 'Setup the codebase and Start the application',
      createdAt: new Date(),
    });

    messages.push({
      id: generateId(),
      role: 'assistant',
      content: createCommandsArtifact(commands, 'project-setup'),
      createdAt: new Date(),
    });
  }

  /*
   * Note: Workbench display is now triggered after files are actually imported
   * See GitUrlImport.client.tsx for the proper timing
   */

  return { messages, commands };
}

/**
 * Handles local folder import initialization
 */
export async function initFromFolder(options: InitFromFolderOptions): Promise<InitResult> {
  const { files, binaryFiles, folderName } = options;

  // Read all file contents using FileReader
  const fileContents = await Promise.all(
    files.map(async (file) => {
      return new Promise<{ content: string; path: string }>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const content = reader.result as string;

          // Extract relative path from webkitRelativePath (remove first folder name)
          const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');
          resolve({
            content,
            path: relativePath,
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }),
  );

  // Detect project commands
  const commands = await detectProjectCommands(fileContents);

  // Build binary files message if applicable
  const binaryFilesMessage =
    binaryFiles.length > 0
      ? `\n\nSkipped ${binaryFiles.length} binary files:\n${binaryFiles.map((f) => `- ${f}`).join('\n')}`
      : '';

  // Create standardized message array
  const messages: Message[] = [];

  // 1. User message
  messages.push({
    id: generateId(),
    role: 'user',
    content: `Import the "${folderName}" folder`,
    createdAt: new Date(),
  });

  // 2. Assistant message with files
  messages.push({
    id: generateId(),
    role: 'assistant',
    content: `I've imported the contents of the "${folderName}" folder.${binaryFilesMessage}

${createFilesArtifact(fileContents, 'Imported Files', 'imported-files')}`,
    createdAt: new Date(),
  });

  // 3-4. If commands exist, add user trigger + assistant commands
  if (commands.setupCommand || commands.startCommand) {
    messages.push({
      id: generateId(),
      role: 'user',
      content: 'Setup the codebase and Start the application',
      createdAt: new Date(),
    });

    messages.push({
      id: generateId(),
      role: 'assistant',
      content: createCommandsArtifact(commands, 'project-setup'),
      createdAt: new Date(),
    });
  }

  return { messages, commands };
}
