import ignore from 'ignore';
import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from './constants';
import { detectProjectCommands, createCommandActionsString } from './projectCommands';

const starterTemplateSelectionPrompt = (templates: Template[]) => `
You are an experienced developer who helps people choose the best starter template for their projects.

CRITICAL DEFAULT RULE:
- When the user does NOT specify a framework (e.g., "build a todo app", "create a website", "make an app"), ALWAYS default to "Vite React"
- This is the standard, go-to template for most web development projects
- Only deviate from "Vite React" when the user explicitly mentions another framework

IMPORTANT RULES:
- Vite React is the DEFAULT for any web application, website, or app request
- Only choose shadcn templates if the user explicitly asks for shadcn or mentions "shadcn"
- Only choose Next.js if the user explicitly mentions "Next.js" or "Next"
- Only choose mobile templates (Expo) if the user explicitly mentions "mobile", "iOS", "Android", or "app" in a mobile context
- Only choose other frameworks (Vue, Angular, Svelte) if explicitly mentioned

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>
  <tags>basic, script</tags>
</template>
${templates
  .map(
    (template) => `
<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  ${template.tags ? `<tags>${template.tags.join(', ')}</tags>` : ''}
</template>
`,
  )
  .join('\n')}

Response Format:
<selection>
  <templateName>{selected template name}</templateName>
  <title>{a proper title for the project}</title>
</selection>

Examples:

<example>
User: I need to build a todo app
Response:
<selection>
  <templateName>Vite React</templateName>
  <title>Todo Application</title>
</selection>
</example>

<example>
User: Create a blog website
Response:
<selection>
  <templateName>Vite React</templateName>
  <title>Blog Website</title>
</selection>
</example>

<example>
User: Build a dashboard with Next.js
Response:
<selection>
  <templateName>Next.JS</templateName>
  <title>Dashboard Application</title>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <title>Number Generation Script</title>
</selection>
</example>

<example>
User: Create a mobile app for tracking habits
Response:
<selection>
  <templateName>Expo App</templateName>
  <title>Habit Tracker Mobile App</title>
</selection>
</example>

Instructions:
1. For trivial tasks and simple scripts, always recommend the blank template
2. For web apps/websites without a specified framework, ALWAYS use "Vite React" (the DEFAULT)
3. Only choose other frameworks when explicitly mentioned by the user
4. Follow the exact XML format
5. Consider both technical requirements and tags

Important: Provide only the selection tags in your response, no additional text.
MOST IMPORTANT: YOU DONT HAVE TIME TO THINK JUST START RESPONDING BASED ON HUNCH
`;

const templates: Template[] = STARTER_TEMPLATES.filter((t) => !t.name.includes('shadcn'));

const parseSelectedTemplate = (llmOutput: string): { template: string; title: string } | null => {
  try {
    // Extract content between <templateName> tags
    const templateNameMatch = llmOutput.match(/<templateName>(.*?)<\/templateName>/);
    const titleMatch = llmOutput.match(/<title>(.*?)<\/title>/);

    if (!templateNameMatch) {
      return null;
    }

    return { template: templateNameMatch[1].trim(), title: titleMatch?.[1].trim() || 'Untitled Project' };
  } catch (error) {
    console.error('Error parsing template selection:', error);
    return null;
  }
};

export const selectStarterTemplate = async (options: { message: string; model: string; provider: ProviderInfo }) => {
  const { message, model, provider } = options;
  const requestBody = {
    message,
    model,
    provider,
    system: starterTemplateSelectionPrompt(templates),
  };
  const response = await fetch('/api/llmcall', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  const respJson: { text: string } = await response.json();
  console.log(respJson);

  const { text } = respJson;
  const selectedTemplate = parseSelectedTemplate(text);

  if (selectedTemplate) {
    return selectedTemplate;
  } else {
    console.log('No template selected, using blank template');

    return {
      template: 'blank',
      title: '',
    };
  }
};

const getGitHubRepoContent = async (repoName: string): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    // Instead of directly fetching from GitHub, use our own API endpoint as a proxy
    const response = await fetch(`/api/github-template?repo=${encodeURIComponent(repoName)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Our API will return the files in the format we need
    const files = (await response.json()) as any;

    return files;
  } catch (error) {
    console.error('Error fetching release contents:', error);
    throw error;
  }
};

const getLocalTemplateContent = async (
  templatePath: string,
): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    // Fetch from local template API endpoint
    const response = await fetch(`/api/local-template?template=${encodeURIComponent(templatePath)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const files = (await response.json()) as { name: string; path: string; content: string }[];

    return files;
  } catch (error) {
    console.error('Error fetching local template:', error);
    throw error;
  }
};

export async function getTemplates(templateName: string, title?: string) {
  // Check if templateName is a GitHub repo path (e.g., "owner/repo/subdirectory")
  if (templateName.includes('/')) {
    console.log(`Fetching template from GitHub path: ${templateName}`);

    try {
      // Fetch directly from GitHub using the full repo path
      const files = await getGitHubRepoContent(templateName);

      let filteredFiles = files;

      // Ignoring common unwanted files
      filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.git') == false);
      filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.codinit') == false);

      // Check for ignore file in .codinit folder
      const templateIgnoreFile = files.find((x) => x.path.startsWith('.codinit') && x.name == 'ignore');

      const filesToImport = {
        files: filteredFiles,
        ignoreFile: [] as typeof filteredFiles,
      };

      if (templateIgnoreFile) {
        const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim());
        const ig = ignore().add(ignorepatterns);
        const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));

        filesToImport.files = filteredFiles;
        filesToImport.ignoreFile = ignoredFiles;
      }

      // Detect project commands from the imported files
      const commands = await detectProjectCommands(filesToImport.files);
      const commandsString = createCommandActionsString(commands);

      const assistantMessage = `
codinit is initializing your project with the required files from GitHub template.
<codinitArtifact id="imported-files" title="${title || 'Create initial files'}" type="bundled">
${filesToImport.files
  .map(
    (file) =>
      `<codinitAction type="file" filePath="${file.path}">
${file.content}
</codinitAction>`,
  )
  .join('\n')}
</codinitArtifact>
${
  commandsString
    ? `

<codinitArtifact id="project-setup" title="Project Setup">
${commandsString}
</codinitArtifact>`
    : ''
}`;
      let userMessage = ``;
      const templatePromptFile = files.filter((x) => x.path.startsWith('.codinit')).find((x) => x.name == 'prompt');

      if (templatePromptFile) {
        userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

---
`;
      }

      if (filesToImport.ignoreFile.length > 0) {
        userMessage =
          userMessage +
          `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
      }

      userMessage += `
---
template import is done, and you can now use the imported files,
edit only the files that need to be changed, and you can create new files as needed.
NO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED
---
Now that the Template is imported please continue with my original request
`;

      // Only add install reminder if no commands were detected
      if (!commands.setupCommand && !commands.startCommand) {
        userMessage += `

IMPORTANT: Remember to install the dependencies and run the appropriate commands for this project.
`;
      }

      return {
        assistantMessage,
        userMessage,
      };
    } catch (error) {
      console.error('Error fetching template from GitHub:', error);
      throw error;
    }
  }

  // Regular template lookup from STARTER_TEMPLATES
  const template = STARTER_TEMPLATES.find((t) => t.name == templateName);

  if (!template) {
    return null;
  }

  // Determine the source and fetch accordingly
  let files: { name: string; path: string; content: string }[];

  if (template.source === 'local' && template.localPath) {
    // Fetch from local templates directory
    files = await getLocalTemplateContent(template.localPath);
  } else if (template.githubRepo) {
    // Fetch from GitHub (fallback)
    files = await getGitHubRepoContent(template.githubRepo);
  } else {
    throw new Error(`Template ${templateName} has no valid source configured`);
  }

  let filteredFiles = files;

  /*
   * ignoring common unwanted files
   * exclude    .git
   */
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.git') == false);

  /*
   * exclude    lock files
   * WE NOW INCLUDE LOCK FILES FOR IMPROVED INSTALL TIMES
   */
  {
    /*
     *const comminLockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
     *filteredFiles = filteredFiles.filter((x) => comminLockFiles.includes(x.name) == false);
     */
  }

  // exclude    .codinit
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.codinit') == false);

  // check for ignore file in .codinit folder
  const templateIgnoreFile = files.find((x) => x.path.startsWith('.codinit') && x.name == 'ignore');

  const filesToImport = {
    files: filteredFiles,
    ignoreFile: [] as typeof filteredFiles,
  };

  if (templateIgnoreFile) {
    // redacting files specified in ignore file
    const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim());
    const ig = ignore().add(ignorepatterns);

    // filteredFiles = filteredFiles.filter(x => !ig.ignores(x.path))
    const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));

    filesToImport.files = filteredFiles;
    filesToImport.ignoreFile = ignoredFiles;
  }

  // Detect project commands from the imported files
  const commands = await detectProjectCommands(filesToImport.files);
  const commandsString = createCommandActionsString(commands);

  const assistantMessage = `
codinit is initializing your project with the required files using the ${template.name} template.
<codinitArtifact id="imported-files" title="${title || 'Create initial files'}" type="bundled">
${filesToImport.files
  .map(
    (file) =>
      `<codinitAction type="file" filePath="${file.path}">
${file.content}
</codinitAction>`,
  )
  .join('\n')}
</codinitArtifact>
${
  commandsString
    ? `

<codinitArtifact id="project-setup" title="Project Setup">
${commandsString}
</codinitArtifact>`
    : ''
}`;
  let userMessage = ``;
  const templatePromptFile = files.filter((x) => x.path.startsWith('.codinit')).find((x) => x.name == 'prompt');

  if (templatePromptFile) {
    userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

---
`;
  }

  if (filesToImport.ignoreFile.length > 0) {
    userMessage =
      userMessage +
      `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
  }

  userMessage += `
---
template import is done, and you can now use the imported files,
edit only the files that need to be changed, and you can create new files as needed.
NO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED
---
Now that the Template is imported please continue with my original request
`;

  // Only add install reminder if no commands were detected
  if (!commands.setupCommand && !commands.startCommand) {
    userMessage += `

IMPORTANT: Remember to install the dependencies and run the appropriate commands for this project.
`;
  }

  return {
    assistantMessage,
    userMessage,
  };
}
