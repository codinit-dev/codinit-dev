import { describe, it, expect } from 'vitest';
import { extractFileReferences, createReferencedFilesContext, processFileReferences } from '~/lib/.server/llm/utils';
import type { FileMap } from '~/lib/.server/llm/constants';

describe('LLM Utils - File References', () => {
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
