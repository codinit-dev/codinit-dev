import { describe, it, expect } from 'vitest';

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```[\w-]*\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  if (match) {
    return match[1].trim();
  }

  const multilineCodeBlockRegex = /```[\w-]*\s*\n([\s\S]*?)```/g;
  let cleaned = content.replace(multilineCodeBlockRegex, (_match, code) => code.trim());

  const inlineCodeBlockRegex = /^```[\w-]*\s*\n?|```\s*$/gm;
  cleaned = cleaned.replace(inlineCodeBlockRegex, '');

  return cleaned.trim() !== content.trim() ? cleaned.trim() : content;
}

describe('message-parser - cleanoutMarkdownSyntax', () => {
  describe('Basic markdown removal', () => {
    it('should remove markdown code block with language', () => {
      const input = '```javascript\nconst x = 1;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });

    it('should remove markdown code block without language', () => {
      const input = '```\nconst x = 1;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });

    it('should handle code with no markdown', () => {
      const input = 'const x = 1;\nconsole.log(x);';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe(input);
    });

    it('should preserve newlines in code', () => {
      const input = '```javascript\nfunction test() {\n  return true;\n}\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('function test() {\n  return true;\n}');
    });
  });

  describe('Language identifiers', () => {
    it('should handle typescript language', () => {
      const input = '```typescript\ninterface User { name: string; }\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('interface User { name: string; }');
    });

    it('should handle python language', () => {
      const input = '```python\ndef hello():\n    print("Hello")\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('def hello():\n    print("Hello")');
    });

    it('should handle language with hyphens', () => {
      const input = '```type-script\nconst x: number = 1;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x: number = 1;');
    });

    it('should handle jsx/tsx', () => {
      const input = '```tsx\nexport const Button = () => <button>Click</button>;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('export const Button = () => <button>Click</button>;');
    });
  });

  describe('Whitespace handling', () => {
    it('should trim leading whitespace', () => {
      const input = '   ```javascript\nconst x = 1;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });

    it('should trim trailing whitespace', () => {
      const input = '```javascript\nconst x = 1;\n```   ';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });

    it('should handle extra newlines', () => {
      const input = '```javascript\n\nconst x = 1;\n\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });

    it('should handle no newline after opening backticks', () => {
      const input = '```javascriptconst x = 1;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('x = 1;');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiline code', () => {
      const input = `\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\``;
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('function fibonacci');
      expect(result).toContain('return fibonacci');
    });

    it('should handle code with backticks inside', () => {
      const input = '```javascript\nconst str = `template ${var}`;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const str = `template ${var}`;');
    });

    it('should handle nested structures', () => {
      const input = `\`\`\`typescript
const obj = {
  nested: {
    value: [1, 2, 3]
  }
};
\`\`\``;
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('const obj = {');
      expect(result).toContain('nested:');
    });

    it('should handle incomplete markdown (no closing backticks)', () => {
      const input = '```javascript\nconst x = 1;';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });

    it('should handle incomplete markdown (no opening backticks)', () => {
      const input = 'const x = 1;\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('const x = 1;');
    });
  });

  describe('Multiple code blocks', () => {
    it('should handle multiple code blocks in sequence', () => {
      const input = `\`\`\`javascript
const a = 1;
\`\`\`

\`\`\`python
b = 2
\`\`\``;
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('const a = 1;');
      expect(result).toContain('b = 2');
    });

    it('should clean multiple inline code blocks', () => {
      const input = 'Some text ```js\ncode1\n``` more text ```py\ncode2\n``` end';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('code1');
      expect(result).toContain('code2');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty code block', () => {
      const input = '```javascript\n\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('');
    });

    it('should handle just backticks', () => {
      const input = '```\n```';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe('');
    });

    it('should preserve code with no markdown at all', () => {
      const input = 'function test() { return 42; }';
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toBe(input);
    });

    it('should handle very long code blocks', () => {
      const code = 'const x = 1;\n'.repeat(100);
      const input = `\`\`\`javascript\n${code}\`\`\``;
      const result = cleanoutMarkdownSyntax(input);
      expect(result.split('\n').length).toBe(100);
    });
  });

  describe('Real-world scenarios', () => {
    it('should clean AI-generated React component', () => {
      const input = `\`\`\`tsx
import React from 'react';

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}
\`\`\``;
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('import React');
      expect(result).toContain('export function Button');
      expect(result).toContain('<button onClick={onClick}>');
    });

    it('should clean AI-generated Python script', () => {
      const input = `\`\`\`python
def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

if __name__ == "__main__":
    print(calculate_fibonacci(10))
\`\`\``;
      const result = cleanoutMarkdownSyntax(input);
      expect(result).toContain('def calculate_fibonacci');
      expect(result).toContain('if __name__');
      expect(result).not.toContain('```');
    });
  });
});
