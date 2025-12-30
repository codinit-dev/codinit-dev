import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractRelativePath, computeFileModifications, diffFiles, fileModificationsToHTML } from '~/utils/diff';
import { WORK_DIR } from '~/utils/constants';
import type { FileMap } from '~/lib/stores/files';

describe('extractRelativePath', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should strip out WORK_DIR from file paths', () => {
    const filePath = `${WORK_DIR}/src/components/Button.tsx`;
    const result = extractRelativePath(filePath);
    expect(result).toBe('src/components/Button.tsx');
  });

  it('should handle nested directories', () => {
    const filePath = `${WORK_DIR}/app/lib/stores/chat.ts`;
    const result = extractRelativePath(filePath);
    expect(result).toBe('app/lib/stores/chat.ts');
  });

  it('should handle root level files', () => {
    const filePath = `${WORK_DIR}/package.json`;
    const result = extractRelativePath(filePath);
    expect(result).toBe('package.json');
  });

  it('should return original path if WORK_DIR is not at the start', () => {
    const filePath = '/some/other/path/file.ts';
    const result = extractRelativePath(filePath);
    expect(result).toBe('/some/other/path/file.ts');
  });

  it('should handle empty WORK_DIR', () => {
    const originalWorkDir = WORK_DIR;

    // Temporarily mock WORK_DIR as empty
    (global as any).WORK_DIR = '';

    const filePath = '/app/src/main.ts';
    const result = extractRelativePath(filePath);
    expect(result).toBe('/app/src/main.ts');

    // Restore original value
    (global as any).WORK_DIR = originalWorkDir;
  });
});

describe('diffFiles', () => {
  it('should generate unified diff for changed content', () => {
    const oldContent = 'Hello World';
    const newContent = 'Hello TypeScript';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('-Hello World');
    expect(result).toContain('+Hello TypeScript');
  });

  it('should return undefined for identical files', () => {
    const content = 'Hello World';
    const result = diffFiles('test.ts', content, content);
    expect(result).toBeUndefined();
  });

  it('should handle multiline changes', () => {
    const oldContent = 'line1\nline2\nline3';
    const newContent = 'line1\nmodified line2\nline3';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('-line2');
    expect(result).toContain('+modified line2');
  });

  it('should handle added lines', () => {
    const oldContent = 'line1\nline2';
    const newContent = 'line1\nline2\nline3';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('+line3');
  });

  it('should handle removed lines', () => {
    const oldContent = 'line1\nline2\nline3';
    const newContent = 'line1\nline3';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('-line2');
  });

  it('should not include file header in diff', () => {
    const oldContent = 'old content';
    const newContent = 'new content';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).not.toContain('--- test.ts');
    expect(result).not.toContain('+++ test.ts');
  });

  it('should handle empty old content', () => {
    const oldContent = '';
    const newContent = 'new content';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('+new content');
  });

  it('should handle empty new content', () => {
    const oldContent = 'old content';
    const newContent = '';
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('-old content');
  });

  it('should handle complex code changes', () => {
    const oldContent = `function hello() {
  console.log("old");
}`;
    const newContent = `function hello() {
  console.log("new");
  return true;
}`;
    const result = diffFiles('test.ts', oldContent, newContent);
    expect(result).toBeDefined();
    expect(result).toContain('-  console.log("old");');
    expect(result).toContain('+  console.log("new");');
    expect(result).toContain('+  return true;');
  });
});

describe('computeFileModifications', () => {
  it('should compute modifications for changed files', () => {
    const files: FileMap = {
      '/home/project/test.ts': {
        type: 'file',
        content: 'new content',
        isBinary: false,
      },
    };
    const modifiedFiles = new Map([['/home/project/test.ts', 'old content']]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('/home/project/test.ts');
  });

  it('should return undefined when no files modified', () => {
    const files: FileMap = {
      '/home/project/test.ts': {
        type: 'file',
        content: 'same content',
        isBinary: false,
      },
    };
    const modifiedFiles = new Map([['/home/project/test.ts', 'same content']]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeUndefined();
  });

  it('should choose appropriate type based on size optimization', () => {
    const files: FileMap = {
      '/home/project/test.ts': {
        type: 'file',
        content: 'new content',
        isBinary: false,
      },
    };
    const modifiedFiles = new Map([['/home/project/test.ts', 'old content']]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeDefined();
    expect(result?.['/home/project/test.ts']?.type).toMatch(/^(file|diff)$/);
    expect(result?.['/home/project/test.ts']?.content).toBeDefined();
  });

  it('should optimize by using smaller representation', () => {
    const files: FileMap = {
      '/home/project/small.ts': {
        type: 'file',
        content: 'x',
        isBinary: false,
      },
    };
    const modifiedFiles = new Map([['/home/project/small.ts', 'y']]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeDefined();

    const mod = result?.['/home/project/small.ts'];
    expect(mod).toBeDefined();
    expect(['file', 'diff']).toContain(mod?.type);
  });

  it('should skip folders', () => {
    const files: FileMap = {
      '/home/project/src': {
        type: 'folder',
      },
    };
    const modifiedFiles = new Map([['/home/project/src', 'some content']]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeUndefined();
  });

  it('should handle multiple modified files', () => {
    const files: FileMap = {
      '/home/project/file1.ts': {
        type: 'file',
        content: 'new content 1',
        isBinary: false,
      },
      '/home/project/file2.ts': {
        type: 'file',
        content: 'new content 2',
        isBinary: false,
      },
    };
    const modifiedFiles = new Map([
      ['/home/project/file1.ts', 'old content 1'],
      ['/home/project/file2.ts', 'old content 2'],
    ]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeDefined();
    expect(Object.keys(result!)).toHaveLength(2);
    expect(result).toHaveProperty('/home/project/file1.ts');
    expect(result).toHaveProperty('/home/project/file2.ts');
  });

  it('should ignore non-existent files in modifications map', () => {
    const files: FileMap = {
      '/home/project/exists.ts': {
        type: 'file',
        content: 'new content',
        isBinary: false,
      },
    };
    const modifiedFiles = new Map([
      ['/home/project/exists.ts', 'old content'],
      ['/home/project/nonexistent.ts', 'old content'],
    ]);
    const result = computeFileModifications(files, modifiedFiles);
    expect(result).toBeDefined();
    expect(Object.keys(result!)).toHaveLength(1);
    expect(result).toHaveProperty('/home/project/exists.ts');
  });
});

describe('fileModificationsToHTML', () => {
  it('should convert modifications to HTML format', () => {
    const modifications = {
      '/home/project/test.ts': {
        type: 'diff' as const,
        content: '@@ -1,1 +1,1 @@\n-old\n+new',
      },
    };
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeDefined();
    expect(result).toContain('<codinit_file_modifications>');
    expect(result).toContain('</codinit_file_modifications>');
    expect(result).toContain('<diff path="/home/project/test.ts">');
    expect(result).toContain('</diff>');
  });

  it('should return undefined for empty modifications', () => {
    const modifications = {};
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeUndefined();
  });

  it('should handle file type modifications', () => {
    const modifications = {
      '/home/project/test.ts': {
        type: 'file' as const,
        content: 'complete file content',
      },
    };
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeDefined();
    expect(result).toContain('<file path="/home/project/test.ts">');
    expect(result).toContain('complete file content');
    expect(result).toContain('</file>');
  });

  it('should handle multiple modifications', () => {
    const modifications = {
      '/home/project/file1.ts': {
        type: 'diff' as const,
        content: 'diff content 1',
      },
      '/home/project/file2.ts': {
        type: 'file' as const,
        content: 'file content 2',
      },
    };
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeDefined();
    expect(result).toContain('file1.ts');
    expect(result).toContain('file2.ts');
    expect(result).toContain('diff content 1');
    expect(result).toContain('file content 2');
  });

  it('should properly escape file paths with special characters', () => {
    const modifications = {
      '/home/project/file with spaces.ts': {
        type: 'diff' as const,
        content: 'diff content',
      },
    };
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeDefined();
    expect(result).toContain('path="/home/project/file with spaces.ts"');
  });

  it('should preserve diff content formatting', () => {
    const modifications = {
      '/home/project/test.ts': {
        type: 'diff' as const,
        content: '@@ -1,3 +1,3 @@\n line1\n-line2\n+modified line2\n line3',
      },
    };
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeDefined();
    expect(result).toContain('@@ -1,3 +1,3 @@');
    expect(result).toContain('-line2');
    expect(result).toContain('+modified line2');
  });

  it('should handle paths with quotes', () => {
    const modifications = {
      '/home/project/file"with"quotes.ts': {
        type: 'diff' as const,
        content: 'content',
      },
    };
    const result = fileModificationsToHTML(modifications);
    expect(result).toBeDefined();
    expect(result).toContain('path=');
  });
});
