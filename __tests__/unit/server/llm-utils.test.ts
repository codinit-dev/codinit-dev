import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractFileReferences,
  createReferencedFilesContext,
  processFileReferences,
  extractPropertiesFromMessage,
  simplifyCodinitActions,
  createFilesContext,
  extractCurrentContext,
} from '~/lib/.server/llm/utils';
import type { FileMap } from '~/lib/.server/llm/constants';
import type { Message } from 'ai';

describe('LLM Utils - File References', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractFileReferences', () => {
    it('should extract single file reference', () => {
      const text = 'Can you check @src/index.ts?';
      const result = extractFileReferences(text);
      expect(result).toEqual(['src/index.ts']);
    });

    it('should extract multiple file references', () => {
      const text = 'Compare @src/index.ts and @src/utils.ts';
      const result = extractFileReferences(text);
      expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
    });

    it('should handle nested paths', () => {
      const text = 'Check @app/components/Button.tsx';
      const result = extractFileReferences(text);
      expect(result).toEqual(['app/components/Button.tsx']);
    });

    it('should handle files with hyphens and underscores', () => {
      const text = 'Look at @src/my-component_v2.tsx';
      const result = extractFileReferences(text);
      expect(result).toEqual(['src/my-component_v2.tsx']);
    });

    it('should return empty array when no references', () => {
      const text = 'No file references here';
      const result = extractFileReferences(text);
      expect(result).toEqual([]);
    });

    it('should handle references at different positions', () => {
      const text = '@README.md in root and @docs/guide.md in docs';
      const result = extractFileReferences(text);
      expect(result).toEqual(['README.md', 'docs/guide.md']);
    });

    it('should handle various file extensions', () => {
      const text = '@app.py @config.json @styles.css @test.spec.ts';
      const result = extractFileReferences(text);
      expect(result).toEqual(['app.py', 'config.json', 'styles.css', 'test.spec.ts']);
    });

    it('should not match email addresses', () => {
      const text = 'Contact user@example.com about @src/file.ts';
      const result = extractFileReferences(text);
      expect(result).toEqual(['src/file.ts']);
    });

    it('should handle config files', () => {
      const text = 'Check @config.env and @.gitignore files and @settings.json';
      const result = extractFileReferences(text);
      expect(result).toContain('config.env');
      expect(result).toContain('settings.json');
    });
  });

  describe('createReferencedFilesContext', () => {
    const mockFiles: FileMap = {
      '/home/project/src/index.ts': {
        type: 'file',
        content: 'export const hello = "world";',
        isBinary: false,
      },
      '/home/project/src/utils.ts': {
        type: 'file',
        content: 'export function add(a: number, b: number) {\n  return a + b;\n}',
        isBinary: false,
      },
      '/home/project/README.md': {
        type: 'file',
        content: '# My Project\n\nThis is a test project.',
        isBinary: false,
      },
      '/home/project/src': {
        type: 'folder',
      },
    };

    it('should create context for single file', () => {
      const result = createReferencedFilesContext(['src/index.ts'], mockFiles);
      expect(result).toContain('<codinitArtifact id="referenced-files"');
      expect(result).toContain('src/index.ts');
      expect(result).toContain('export const hello = "world";');
    });

    it('should create context for multiple files', () => {
      const result = createReferencedFilesContext(['src/index.ts', 'src/utils.ts'], mockFiles);
      expect(result).toContain('src/index.ts');
      expect(result).toContain('src/utils.ts');
      expect(result).toContain('export const hello');
      expect(result).toContain('export function add');
    });

    it('should return empty string for non-existent file', () => {
      const result = createReferencedFilesContext(['non/existent.ts'], mockFiles);
      expect(result).toBe('');
    });

    it('should skip folders', () => {
      const result = createReferencedFilesContext(['src'], mockFiles);
      expect(result).toBe('');
    });

    it('should handle mixed valid and invalid references', () => {
      const result = createReferencedFilesContext(['src/index.ts', 'fake.ts', 'src/utils.ts'], mockFiles);
      expect(result).toContain('src/index.ts');
      expect(result).toContain('src/utils.ts');
      expect(result).not.toContain('fake.ts');
    });

    it('should use codinitAction format', () => {
      const result = createReferencedFilesContext(['README.md'], mockFiles);
      expect(result).toContain('<codinitAction type="file"');
      expect(result).toContain('filePath="README.md"');
      expect(result).toContain('</codinitAction>');
    });

    it('should preserve file content formatting', () => {
      const result = createReferencedFilesContext(['src/utils.ts'], mockFiles);
      expect(result).toContain('function add(a: number, b: number)');
      expect(result).toContain('return a + b;');
    });

    it('should use custom work directory', () => {
      const customFiles: FileMap = {
        '/custom/path/file.ts': {
          type: 'file',
          content: 'test content',
          isBinary: false,
        },
      };
      const result = createReferencedFilesContext(['file.ts'], customFiles, '/custom/path');
      expect(result).toContain('test content');
    });
  });

  describe('processFileReferences', () => {
    const mockFiles: FileMap = {
      '/home/project/src/index.ts': {
        type: 'file',
        content: 'export const hello = "world";',
        isBinary: false,
      },
      '/home/project/src/utils.ts': {
        type: 'file',
        content: 'export function add(a, b) { return a + b; }',
        isBinary: false,
      },
    };

    it('should remove @ from file references and return context', () => {
      const message = 'Can you fix @src/index.ts?';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('Can you fix src/index.ts?');
      expect(result.referencedFilesContext).toContain('src/index.ts');
      expect(result.referencedFilesContext).toContain('export const hello');
    });

    it('should handle multiple references', () => {
      const message = 'Compare @src/index.ts and @src/utils.ts';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('Compare src/index.ts and src/utils.ts');
      expect(result.referencedFilesContext).toContain('src/index.ts');
      expect(result.referencedFilesContext).toContain('src/utils.ts');
    });

    it('should return empty context when no files found', () => {
      const message = 'No file references here';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('No file references here');
      expect(result.referencedFilesContext).toBe('');
    });

    it('should handle non-existent file references', () => {
      const message = 'Check @fake/file.ts';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('Check fake/file.ts');
      expect(result.referencedFilesContext).toBe('');
    });

    it('should preserve other text formatting', () => {
      const message = 'Please review @src/index.ts and let me know.\nThanks!';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toContain('Please review');
      expect(result.cleanedContent).toContain('let me know');
      expect(result.cleanedContent).toContain('Thanks!');
    });

    it('should handle references at start of message', () => {
      const message = '@src/index.ts needs fixing';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('src/index.ts needs fixing');
    });

    it('should handle references at end of message', () => {
      const message = 'Fix the bug in @src/index.ts';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('Fix the bug in src/index.ts');
    });

    it('should handle adjacent references', () => {
      const message = 'Compare @src/index.ts@src/utils.ts';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toBe('Compare src/index.tssrc/utils.ts');
    });
  });

  describe('Integration - Complete Flow', () => {
    const mockFiles: FileMap = {
      '/home/project/app/main.ts': {
        type: 'file',
        content: 'import { helper } from "./utils";\n\nfunction main() {\n  helper();\n}',
        isBinary: false,
      },
      '/home/project/app/utils.ts': {
        type: 'file',
        content: 'export function helper() {\n  console.log("Helper called");\n}',
        isBinary: false,
      },
      '/home/project/package.json': {
        type: 'file',
        content: '{\n  "name": "test-app",\n  "version": "1.0.0"\n}',
        isBinary: false,
      },
    };

    it('should process complex message with multiple file types', () => {
      const message = 'The bug is in @app/main.ts which imports from @app/utils.ts. Check @package.json too.';
      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).not.toContain('@');
      expect(result.referencedFilesContext).toContain('app/main.ts');
      expect(result.referencedFilesContext).toContain('app/utils.ts');
      expect(result.referencedFilesContext).toContain('package.json');

      expect(result.referencedFilesContext).toContain('import { helper }');
      expect(result.referencedFilesContext).toContain('export function helper');
      expect(result.referencedFilesContext).toContain('"name": "test-app"');
    });

    it('should handle realistic chat message', () => {
      const message = `I noticed an issue in @app/main.ts where the import is incorrect.
Can you fix it to properly import from @app/utils.ts?`;

      const result = processFileReferences(message, mockFiles);

      expect(result.cleanedContent).toContain('app/main.ts');
      expect(result.cleanedContent).toContain('app/utils.ts');
      expect(result.cleanedContent).not.toContain('@app/');

      expect(result.referencedFilesContext).toContain('<codinitArtifact');
      expect(result.referencedFilesContext).toContain('<codinitAction type="file"');
      expect(result.referencedFilesContext.match(/<codinitAction/g)?.length).toBe(2);
    });
  });
});

describe('LLM Utils - Message Processing', () => {
  describe('extractPropertiesFromMessage', () => {
    it('should extract model and provider from message content', () => {
      const message = {
        role: 'user' as const,
        content: '[Model: gpt-4]\n\n[Provider: OpenAI]\n\nHello world',
      };
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('gpt-4');
      expect(result.provider).toBe('OpenAI');
      expect(result.content).toBe('Hello world');
    });

    it('should use default model when not specified', () => {
      const message = {
        role: 'user' as const,
        content: '[Provider: Anthropic]\n\nHello world',
      };
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('claude-4-5-sonnet-latest');
      expect(result.provider).toBe('Anthropic');
    });

    it('should use default provider when not specified', () => {
      const message = {
        role: 'user' as const,
        content: '[Model: gpt-4]\n\nHello world',
      };
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('gpt-4');
      expect(result.provider).toBe('Anthropic');
    });

    it('should handle plain text without model or provider', () => {
      const message = {
        role: 'user' as const,
        content: 'Hello world',
      };
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('claude-4-5-sonnet-latest');
      expect(result.provider).toBe('Anthropic');
      expect(result.content).toBe('Hello world');
    });

    it('should handle array content with text type', () => {
      const message = {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: '[Model: gpt-4]\n\n[Provider: OpenAI]\n\nHello' }],
      } as any;
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('gpt-4');
      expect(result.provider).toBe('OpenAI');
    });

    it('should handle array content with image and text', () => {
      const message = {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: '[Model: gpt-4]\n\nDescribe this image' },
          { type: 'image_url' as const, image_url: { url: 'https://example.com/image.png' } },
        ],
      } as any;
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('gpt-4');
      expect(Array.isArray(result.content)).toBe(true);

      if (Array.isArray(result.content)) {
        expect(result.content[0].type).toBe('text');
        expect(result.content[1].type).toBe('image_url');
      }
    });

    it('should remove model and provider tags from cleaned content', () => {
      const message = {
        role: 'user' as const,
        content: '[Model: gpt-4]\n\n[Provider: OpenAI]\n\nActual message',
      };
      const result = extractPropertiesFromMessage(message);
      expect(result.content).toBe('Actual message');
      expect(result.content).not.toContain('[Model:');
      expect(result.content).not.toContain('[Provider:');
    });

    it('should handle empty text in array content', () => {
      const message = {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: '' }],
      } as any;
      const result = extractPropertiesFromMessage(message);
      expect(result.model).toBe('claude-4-5-sonnet-latest');
      expect(result.provider).toBe('Anthropic');
    });
  });

  describe('simplifyCodinitActions', () => {
    it('should simplify codinitAction tags with type="file"', () => {
      const input =
        '<codinitAction type="file" filePath="/src/index.ts">console.log("hello");\nconsole.log("world");</codinitAction>';
      const result = simplifyCodinitActions(input);
      expect(result).toContain('...');
      expect(result).not.toContain('console.log("hello")');
    });

    it('should preserve non-file action types', () => {
      const input = '<codinitAction type="shell">npm install</codinitAction>';
      const result = simplifyCodinitActions(input);
      expect(result).toBe(input);
    });

    it('should handle multiple file actions', () => {
      const input = `<codinitAction type="file" filePath="/src/a.ts">content a</codinitAction>
<codinitAction type="file" filePath="/src/b.ts">content b</codinitAction>`;
      const result = simplifyCodinitActions(input);
      expect(result).not.toContain('content a');
      expect(result).not.toContain('content b');
      expect(result.match(/\.\.\./g)?.length).toBe(2);
    });

    it('should handle mixed action types', () => {
      const input = `<codinitAction type="file" filePath="/src/index.ts">file content</codinitAction>
<codinitAction type="shell">npm test</codinitAction>`;
      const result = simplifyCodinitActions(input);
      expect(result).not.toContain('file content');
      expect(result).toContain('npm test');
    });

    it('should handle multiline file content', () => {
      const input = `<codinitAction type="file" filePath="/src/index.ts">
function hello() {
  console.log("world");
}
</codinitAction>`;
      const result = simplifyCodinitActions(input);
      expect(result).toContain('...');
      expect(result).not.toContain('function hello');
    });

    it('should return original string if no file actions found', () => {
      const input = 'No codinit actions here';
      const result = simplifyCodinitActions(input);
      expect(result).toBe(input);
    });

    it('should preserve attributes in opening tag', () => {
      const input = '<codinitAction type="file" filePath="/test.ts" otherAttr="value">content</codinitAction>';
      const result = simplifyCodinitActions(input);
      expect(result).toContain('type="file"');
      expect(result).toContain('filePath="/test.ts"');
    });
  });

  describe('createFilesContext', () => {
    const mockFiles: FileMap = {
      '/home/project/src/index.ts': {
        type: 'file',
        content: 'export const hello = "world";',
        isBinary: false,
      },
      '/home/project/src/utils.ts': {
        type: 'file',
        content: 'export function add(a: number, b: number) {\n  return a + b;\n}',
        isBinary: false,
      },
      '/home/project/node_modules/package/index.js': {
        type: 'file',
        content: 'module.exports = {};',
        isBinary: false,
      },
      '/home/project/.git/config': {
        type: 'file',
        content: '[core]\n  repositoryformatversion = 0',
        isBinary: false,
      },
      '/home/project/src': {
        type: 'folder',
      },
    };

    it('should create context for all non-ignored files', () => {
      const result = createFilesContext(mockFiles);
      expect(result).toContain('<codinitArtifact id="code-content"');
      expect(result).toContain('src/index.ts');
      expect(result).toContain('export const hello');
    });

    it('should ignore node_modules files', () => {
      const result = createFilesContext(mockFiles);
      expect(result).not.toContain('node_modules');
    });

    it('should ignore .git files', () => {
      const result = createFilesContext(mockFiles);
      expect(result).not.toContain('.git');
    });

    it('should skip folders', () => {
      const result = createFilesContext(mockFiles);
      const folderReferences = result.match(/filePath="src"/g);
      expect(folderReferences).toBeNull();
    });

    it('should use full path by default', () => {
      const result = createFilesContext(mockFiles, false);
      expect(result).toContain('/home/project/src/index.ts');
    });

    it('should use relative path when specified', () => {
      const result = createFilesContext(mockFiles, true);
      expect(result).toContain('src/index.ts');
      expect(result).not.toContain('/home/project/src/index.ts');
    });

    it('should preserve file content formatting', () => {
      const result = createFilesContext(mockFiles);
      expect(result).toContain('export function add');
      expect(result).toContain('return a + b;');
    });

    it('should wrap content in codinitArtifact', () => {
      const result = createFilesContext(mockFiles);
      expect(result).toMatch(/^<codinitArtifact/);
      expect(result).toMatch(/<\/codinitArtifact>$/);
    });

    it('should use codinitAction for each file', () => {
      const result = createFilesContext(mockFiles);
      const actionCount = (result.match(/<codinitAction type="file"/g) || []).length;
      expect(actionCount).toBeGreaterThan(0);
    });
  });

  describe('extractCurrentContext', () => {
    it('should extract codeContext from last assistant message', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there',
          annotations: [
            {
              type: 'codeContext',
              files: ['src/index.ts'],
            },
          ],
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.codeContext).toBeDefined();
      expect(result.codeContext?.type).toBe('codeContext');
    });

    it('should extract chatSummary from last assistant message', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi',
          annotations: [
            {
              type: 'chatSummary',
              summary: 'User greeted the assistant',
            },
          ],
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.summary).toBeDefined();
      expect(result.summary?.type).toBe('chatSummary');
    });

    it('should return undefined when no assistant messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.summary).toBeUndefined();
      expect(result.codeContext).toBeUndefined();
    });

    it('should return undefined when assistant message has no annotations', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi',
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.summary).toBeUndefined();
      expect(result.codeContext).toBeUndefined();
    });

    it('should use last assistant message when multiple exist', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'First',
          annotations: [
            {
              type: 'codeContext',
              files: ['old.ts'],
            },
          ],
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Second',
          annotations: [
            {
              type: 'codeContext',
              files: ['new.ts'],
            },
          ],
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.codeContext).toBeDefined();
    });

    it('should handle annotations with invalid objects', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi',
          annotations: [null, 'string', 123] as any,
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.summary).toBeUndefined();
      expect(result.codeContext).toBeUndefined();
    });

    it('should skip annotations without type property', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi',
          annotations: [{ data: 'some data' }, { type: 'codeContext', files: [] }],
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.codeContext).toBeDefined();
    });

    it('should break on first matching annotation', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi',
          annotations: [
            { type: 'codeContext', files: ['first.ts'] },
            { type: 'chatSummary', summary: 'should not reach' },
          ],
        },
      ];
      const result = extractCurrentContext(messages);
      expect(result.codeContext).toBeDefined();
      expect(result.summary).toBeUndefined();
    });

    it('should handle empty messages array', () => {
      const messages: Message[] = [];
      const result = extractCurrentContext(messages);
      expect(result.summary).toBeUndefined();
      expect(result.codeContext).toBeUndefined();
    });
  });
});
