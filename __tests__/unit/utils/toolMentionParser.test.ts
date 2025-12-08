import { describe, it, expect } from 'vitest';
import {
  shouldShowAutocomplete,
  detectReferenceType,
  insertToolMention,
  insertFileReference,
} from '~/utils/toolMentionParser';

describe('toolMentionParser', () => {
  describe('shouldShowAutocomplete', () => {
    it('should return isOpen=true when @ is at start of text', () => {
      const result = shouldShowAutocomplete('@', 1);
      expect(result.isOpen).toBe(true);
      expect(result.searchQuery).toBe('');
      expect(result.atPosition).toBe(0);
    });

    it('should return isOpen=true when @ is after whitespace', () => {
      const result = shouldShowAutocomplete('Hello @', 7);
      expect(result.isOpen).toBe(true);
      expect(result.searchQuery).toBe('');
      expect(result.atPosition).toBe(6);
    });

    it('should return isOpen=true with search query', () => {
      const result = shouldShowAutocomplete('Hello @tool', 11);
      expect(result.isOpen).toBe(true);
      expect(result.searchQuery).toBe('tool');
      expect(result.atPosition).toBe(6);
    });

    it('should return isOpen=false when @ is in middle of word', () => {
      const result = shouldShowAutocomplete('email@example.com', 6);
      expect(result.isOpen).toBe(false);
    });

    it('should return isOpen=false when search contains space', () => {
      const result = shouldShowAutocomplete('Hello @tool name', 16);
      expect(result.isOpen).toBe(false);
    });

    it('should return isOpen=false when no @ present', () => {
      const result = shouldShowAutocomplete('Hello world', 11);
      expect(result.isOpen).toBe(false);
    });

    it('should handle @ with file path', () => {
      const result = shouldShowAutocomplete('@src/index.ts', 13);
      expect(result.isOpen).toBe(true);
      expect(result.searchQuery).toBe('src/index.ts');
    });

    it('should handle multiple @ symbols', () => {
      const result = shouldShowAutocomplete('Use @tool1 and @tool2', 21);
      expect(result.isOpen).toBe(true);
      expect(result.searchQuery).toBe('tool2');
      expect(result.atPosition).toBe(15);
    });
  });

  describe('detectReferenceType', () => {
    it('should detect tool reference when no special chars', () => {
      expect(detectReferenceType('toolname')).toBe('tool');
      expect(detectReferenceType('myTool123')).toBe('tool');
      expect(detectReferenceType('')).toBe('tool');
    });

    it('should detect file reference when contains slash', () => {
      expect(detectReferenceType('src/file')).toBe('file');
      expect(detectReferenceType('app/lib/store')).toBe('file');
      expect(detectReferenceType('/absolute/path')).toBe('file');
    });

    it('should detect file reference when contains dot', () => {
      expect(detectReferenceType('file.ts')).toBe('file');
      expect(detectReferenceType('package.json')).toBe('file');
      expect(detectReferenceType('.env')).toBe('file');
    });

    it('should detect file reference with both slash and dot', () => {
      expect(detectReferenceType('src/index.ts')).toBe('file');
      expect(detectReferenceType('app/components/Button.tsx')).toBe('file');
    });
  });

  describe('insertToolMention', () => {
    it('should insert tool mention at @ position', () => {
      const text = 'Use @';
      const result = insertToolMention(text, 5, 'myTool');
      expect(result.newText).toBe('Use @myTool ');
      expect(result.newCursorPos).toBe(12);
    });

    it('should replace partial tool name', () => {
      const text = 'Use @my';
      const result = insertToolMention(text, 7, 'myTool');
      expect(result.newText).toBe('Use @myTool ');
      expect(result.newCursorPos).toBe(12);
    });

    it('should preserve text after cursor', () => {
      const text = 'Use @my and more';
      const result = insertToolMention(text, 7, 'myTool');
      expect(result.newText).toBe('Use @myTool  and more');
      expect(result.newCursorPos).toBe(12);
    });

    it('should handle multiple @ symbols', () => {
      const text = 'Use @tool1 and @';
      const result = insertToolMention(text, 16, 'tool2');
      expect(result.newText).toBe('Use @tool1 and @tool2 ');
      expect(result.newCursorPos).toBe(22);
    });

    it('should return original when no @ found', () => {
      const text = 'Hello world';
      const result = insertToolMention(text, 11, 'myTool');
      expect(result.newText).toBe('Hello world');
      expect(result.newCursorPos).toBe(11);
    });
  });

  describe('insertFileReference', () => {
    it('should insert file reference at @ position', () => {
      const text = 'Check @';
      const result = insertFileReference(text, 7, 'src/index.ts');
      expect(result.newText).toBe('Check @src/index.ts ');
      expect(result.newCursorPos).toBe(20);
    });

    it('should replace partial file path', () => {
      const text = 'Check @src/';
      const result = insertFileReference(text, 11, 'src/index.ts');
      expect(result.newText).toBe('Check @src/index.ts ');
      expect(result.newCursorPos).toBe(20);
    });

    it('should preserve text after cursor', () => {
      const text = 'Check @src/ for bugs';
      const result = insertFileReference(text, 11, 'src/index.ts');
      expect(result.newText).toBe('Check @src/index.ts  for bugs');
      expect(result.newCursorPos).toBe(20);
    });

    it('should handle nested file paths', () => {
      const text = 'Fix @';
      const result = insertFileReference(text, 5, 'app/components/Button.tsx');
      expect(result.newText).toBe('Fix @app/components/Button.tsx ');
      expect(result.newCursorPos).toBe(31);
    });

    it('should return original when no @ found', () => {
      const text = 'Hello world';
      const result = insertFileReference(text, 11, 'src/file.ts');
      expect(result.newText).toBe('Hello world');
      expect(result.newCursorPos).toBe(11);
    });
  });
});
