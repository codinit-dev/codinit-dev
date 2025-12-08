import { type Message } from 'ai';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { IGNORE_PATTERNS, type FileMap } from './constants';
import ignore from 'ignore';
import type { ContextAnnotation } from '~/types/context';

export function extractPropertiesFromMessage(message: Omit<Message, 'id'>): {
  model: string;
  provider: string;
  content: string;
} {
  const textContent = Array.isArray(message.content)
    ? message.content.find((item) => item.type === 'text')?.text || ''
    : message.content;

  const modelMatch = textContent.match(MODEL_REGEX);
  const providerMatch = textContent.match(PROVIDER_REGEX);

  /*
   * Extract model
   * const modelMatch = message.content.match(MODEL_REGEX);
   */
  const model = modelMatch ? modelMatch[1] : DEFAULT_MODEL;

  /*
   * Extract provider
   * const providerMatch = message.content.match(PROVIDER_REGEX);
   */
  const provider = providerMatch ? providerMatch[1] : DEFAULT_PROVIDER.name;

  const cleanedContent = Array.isArray(message.content)
    ? message.content.map((item) => {
        if (item.type === 'text') {
          return {
            type: 'text',
            text: item.text?.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, ''),
          };
        }

        return item; // Preserve image_url and other types as is
      })
    : textContent.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '');

  return { model, provider, content: cleanedContent };
}

export function simplifyCodinitActions(input: string): string {
  // Using regex to match codinitAction tags that have type="file"
  const regex = /(<codinitAction[^>]*type="file"[^>]*>)([\s\S]*?)(<\/codinitAction>)/g;

  // Replace each matching occurrence
  return input.replace(regex, (_0, openingTag, _2, closingTag) => {
    return `${openingTag}\n          ...\n        ${closingTag}`;
  });
}

export function createFilesContext(files: FileMap, useRelativePath?: boolean) {
  const ig = ignore().add(IGNORE_PATTERNS);
  let filePaths = Object.keys(files);
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  const fileContexts = filePaths
    .filter((x) => files[x] && files[x].type == 'file')
    .map((path) => {
      const dirent = files[path];

      if (!dirent || dirent.type == 'folder') {
        return '';
      }

      const codeWithLinesNumbers = dirent.content
        .split('\n')
        // .map((v, i) => `${i + 1}|${v}`)
        .join('\n');

      let filePath = path;

      if (useRelativePath) {
        filePath = path.replace('/home/project/', '');
      }

      return `<codinitAction type="file" filePath="${filePath}">${codeWithLinesNumbers}</codinitAction>`;
    });

  return `<codinitArtifact id="code-content" title="Code Content" >\n${fileContexts.join('\n')}\n</codinitArtifact>`;
}

export function extractFileReferences(text: string): string[] {
  const pattern = /@([\w\-./]+\.\w+)/g;
  const matches = text.matchAll(pattern);
  const results = Array.from(matches).map((m) => m[1]);

  return results.filter((ref) => {
    if (ref.includes('/')) {
      return true;
    }

    const parts = ref.split('.');
    const extension = parts[parts.length - 1];
    const commonExtensions = [
      'js',
      'ts',
      'jsx',
      'tsx',
      'py',
      'json',
      'md',
      'css',
      'scss',
      'html',
      'txt',
      'yml',
      'yaml',
      'xml',
      'env',
      'config',
      'spec',
      'test',
    ];

    if (commonExtensions.includes(extension.toLowerCase())) {
      return true;
    }

    const emailPattern = /^[a-z]+\.[a-z]{2,}$/i;

    if (emailPattern.test(ref)) {
      return false;
    }

    return true;
  });
}

export function createReferencedFilesContext(
  referencedPaths: string[],
  files: FileMap,
  workDir: string = '/home/project',
): string {
  const fileContexts = referencedPaths
    .map((relativePath) => {
      const fullPath = `${workDir}/${relativePath}`;
      const dirent = files[fullPath];

      if (!dirent || dirent.type !== 'file') {
        return '';
      }

      return `<codinitAction type="file" filePath="${relativePath}">${dirent.content}</codinitAction>`;
    })
    .filter((ctx) => ctx !== '');

  if (fileContexts.length === 0) {
    return '';
  }

  return `<codinitArtifact id="referenced-files" title="Referenced Files">\n${fileContexts.join('\n')}\n</codinitArtifact>`;
}

export function processFileReferences(
  messageContent: string,
  files: FileMap,
): { cleanedContent: string; referencedFilesContext: string } {
  const referencedPaths = extractFileReferences(messageContent);

  const cleanedContent = messageContent.replace(/@([\w\-./]+\.\w+)/g, '$1');

  const referencedFilesContext = createReferencedFilesContext(referencedPaths, files);

  return {
    cleanedContent,
    referencedFilesContext,
  };
}

export function extractCurrentContext(messages: Message[]) {
  const lastAssistantMessage = messages.filter((x) => x.role == 'assistant').slice(-1)[0];

  if (!lastAssistantMessage) {
    return { summary: undefined, codeContext: undefined };
  }

  let summary: ContextAnnotation | undefined;
  let codeContext: ContextAnnotation | undefined;

  if (!lastAssistantMessage.annotations?.length) {
    return { summary: undefined, codeContext: undefined };
  }

  for (let i = 0; i < lastAssistantMessage.annotations.length; i++) {
    const annotation = lastAssistantMessage.annotations[i];

    if (!annotation || typeof annotation !== 'object') {
      continue;
    }

    if (!(annotation as any).type) {
      continue;
    }

    const annotationObject = annotation as any;

    if (annotationObject.type === 'codeContext') {
      codeContext = annotationObject;
      break;
    } else if (annotationObject.type === 'chatSummary') {
      summary = annotationObject;
      break;
    }
  }

  return { summary, codeContext };
}
