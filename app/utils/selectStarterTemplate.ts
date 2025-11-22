import ignore from 'ignore';
import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from './constants';

const starterTemplateSelectionPrompt = (templates: Template[]) => `
You are an experienced developer who helps people choose the best starter template for their projects, Vite is preferred.

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter ONLY for simple scripts and command-line utilities (e.g., "write a script to...", "create a function that...")</description>
  <tags>basic, script, cli</tags>
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
  <templateName>shadcn/ui Vite React</templateName>
  <title>Simple React todo application</title>
</selection>
</example>

<example>
User: Create a website for my portfolio
Response:
<selection>
  <templateName>shadcn/ui Vite React</templateName>
  <title>Portfolio website</title>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <title>script to generate numbers from 1 to 100</title>
</selection>
</example>

<example>
User: Build an e-commerce landing page
Response:
<selection>
  <templateName>shadcn/ui Vite React</templateName>
  <title>E-commerce landing page</title>
</selection>
</example>

Instructions:
1. For simple scripts and command-line utilities ONLY, use the blank template
2. For ANY web application, website, landing page, or UI project without a specific framework mentioned, DEFAULT to "shadcn/ui Vite React"
3. For specific framework requests (Next.js, Astro, Angular, etc.), recommend the matching template
4. Follow the exact XML format
5. Consider both technical requirements and tags
6. When in doubt between blank and a web framework, ALWAYS choose "shadcn/ui Vite React"

Important: Provide only the selection tags in your response, no additional text.
MOST IMPORTANT: YOU DONT HAVE TIME TO THINK JUST START RESPONDING BASED ON HUNCH 
`;

const templates: Template[] = STARTER_TEMPLATES;

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
    console.log('No template selected, using shadcn/ui Vite React as default');

    return {
      template: 'shadcn/ui Vite React',
      title: 'New Project',
    };
  }
};

const getGitHubRepoContent = async (repoName: string): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    // Instead of directly fetching from GitHub, use our own API endpoint as a proxy
    const response = await fetch(`/api/github-template?repo=${encodeURIComponent(repoName)}`);

    if (!response.ok) {
      // Parse error response for specific error types
      let errorMessage = 'NETWORK_ERROR';

      try {
        const errorData: any = await response.json();
        const errorDetails = errorData.error || errorData.details || '';

        // Check for specific error conditions
        if (response.status === 404) {
          errorMessage = 'REPO_NOT_FOUND';
        } else if (response.status === 403) {
          // Check if it's a rate limit error
          if (errorDetails.toLowerCase().includes('rate limit')) {
            errorMessage = 'RATE_LIMIT';
          } else {
            errorMessage = 'AUTH_REQUIRED';
          }
        } else if (response.status === 401) {
          errorMessage = 'AUTH_REQUIRED';
        } else if (response.status >= 500) {
          errorMessage = 'GITHUB_API_ERROR';
        }
      } catch {
        // If JSON parsing fails, use status-based error
        if (response.status === 404) {
          errorMessage = 'REPO_NOT_FOUND';
        } else if (response.status === 403) {
          errorMessage = 'RATE_LIMIT';
        } else if (response.status === 401) {
          errorMessage = 'AUTH_REQUIRED';
        } else if (response.status >= 500) {
          errorMessage = 'GITHUB_API_ERROR';
        }
      }

      throw new Error(errorMessage);
    }

    // Our API will return the files in the format we need
    const data = (await response.json()) as any;

    // Handle new response format with files and failedFiles
    return data.files || data;
  } catch (error) {
    console.error('Error fetching release contents:', error);
    throw error;
  }
};

export async function getTemplates(templateName: string, title?: string) {
  const template = STARTER_TEMPLATES.find((t) => t.name == templateName);

  if (!template) {
    return null;
  }

  const githubRepo = template.githubRepo;

  // Fetch files from GitHub
  const githubContent: any = await getGitHubRepoContent(githubRepo);
  const files: Array<{ name: string; path: string; content: string }> = githubContent.files || githubContent;
  const failedFiles = githubContent.failedFiles;

  let filteredFiles: Array<{ name: string; path: string; content: string }> = files;

  /*
   * ignoring common unwanted files
   * exclude    .git
   */
  filteredFiles = filteredFiles.filter((x: { path: string }) => x.path.startsWith('.git') == false);

  /*
   * exclude    lock files
   * WE NOW INCLUDE LOCK FILES FOR IMPROVED INSTALL TIMES
   */
  {
    /*
     *const comminLockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
     *filteredFiles = filteredFiles.filter((x: { name: string }) => comminLockFiles.includes(x.name) == false);
     */
  }

  // exclude    .codinit
  filteredFiles = filteredFiles.filter((x: { path: string }) => x.path.startsWith('.codinit') == false);

  // check for ignore file in .codinit folder
  const templateIgnoreFile = files.find(
    (x: { path: string; name: string }) => x.path.startsWith('.codinit') && x.name == 'ignore',
  );

  const filesToImport = {
    files: filteredFiles,
    ignoreFile: [] as typeof filteredFiles,
  };

  if (templateIgnoreFile) {
    // redacting files specified in ignore file
    const ignorepatterns = templateIgnoreFile.content.split('\n').map((x: string) => x.trim());
    const ig = ignore().add(ignorepatterns);

    // filteredFiles = filteredFiles.filter(x => !ig.ignores(x.path))
    const ignoredFiles = filteredFiles.filter((x: { path: string }) => ig.ignores(x.path));

    filesToImport.files = filteredFiles;
    filesToImport.ignoreFile = ignoredFiles;
  }

  const assistantMessage = `
CodinIT is initializing your project with the required files using the ${template.name} template.
<codinitArtifact id="imported-files" title="${title || 'Create initial files'}" type="bundled">
${filesToImport.files
  .map(
    (file: { path: string; content: string }) =>
      `<codinitAction type="file" filePath="${file.path}">
${file.content}
</codinitAction>`,
  )
  .join('\n')}
</codinitArtifact>
`;
  let userMessage = ``;
  const templatePromptFile = files
    .filter((x: { path: string }) => x.path.startsWith('.codinit'))
    .find((x: { name: string }) => x.name == 'prompt');

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
${filesToImport.ignoreFile.map((file: { path: string }) => `- ${file.path}`).join('\n')}

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
DO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED
---
Now that the Template is imported please continue with my original request

IMPORTANT: Dont Forget to install the dependencies before running the app by using \`npm install && npm run dev\`
`;

  return {
    assistantMessage,
    userMessage,
    failedFiles,
  };
}
