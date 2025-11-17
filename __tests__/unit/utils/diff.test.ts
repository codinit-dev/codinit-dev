import { describe, it, expect } from 'vitest';
import { extractRelativePath } from '~/utils/diff';
import { WORK_DIR } from '~/utils/constants';

describe('extractRelativePath', () => {
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
