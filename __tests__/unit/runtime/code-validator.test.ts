import { describe, it, expect } from 'vitest';
import { validateCode } from '~/lib/runtime/code-validator';

describe('code-validator', () => {
  describe('validateCode - General', () => {
    it('should detect placeholder comments', () => {
      const code = `
function test() {
  // rest of code here
  return true;
}
      `;
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Code contains placeholder comment "// rest of code here"');
    });

    it('should detect ellipsis placeholders', () => {
      const code = `
function test() {
  const x = 1;
  /* ... */
  return x;
}
      `;
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Code contains ellipsis placeholders');
    });

    it('should warn about markdown code blocks', () => {
      const code = '```javascript\nconst x = 1;\n```';
      const result = validateCode('test.js', code);
      expect(result.warnings).toContain('File contains markdown code block syntax (```)');
    });

    it('should pass valid code without placeholders', () => {
      const code = `
function add(a, b) {
  return a + b;
}
      `;
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateCode - JavaScript/TypeScript', () => {
    it('should detect mismatched braces', () => {
      const code = `
function test() {
  if (true) {
    console.log('test');
  // missing closing brace
}
      `;
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Mismatched braces'))).toBe(true);
    });

    it('should detect mismatched parentheses', () => {
      const code = 'function test(a, b {\n  return a + b;\n}';
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('parentheses'))).toBe(true);
    });

    it('should detect mismatched brackets', () => {
      const code = 'const arr = [1, 2, 3;';
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('brackets'))).toBe(true);
    });

    it('should pass valid JavaScript', () => {
      const code = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(result);
      `;
      const result = validateCode('fib.js', code);
      expect(result.isValid).toBe(true);
    });

    it('should pass valid TypeScript', () => {
      const code = `
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
      `;
      const result = validateCode('greet.ts', code);
      expect(result.isValid).toBe(true);
    });

    it('should detect mixed Python/JS syntax', () => {
      const code = 'import from http';
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('mixing JavaScript and Python'))).toBe(true);
    });

    it('should ignore comments when counting braces', () => {
      const code = `
function test() {
  // This is a comment with {braces}
  /* Another comment { with } braces */
  return true;
}
      `;
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCode - Python', () => {
    it('should warn about tabs instead of spaces', () => {
      const code = 'def test():\n\treturn True';
      const result = validateCode('test.py', code);
      expect(result.warnings.some((w) => w.includes('tabs instead of spaces'))).toBe(true);
    });

    it('should detect JavaScript keywords in Python', () => {
      const code = `
const x = 5
let y = 10
var z = 15
      `;
      const result = validateCode('test.py', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('JavaScript variable declarations'))).toBe(true);
    });

    it('should warn about function keyword', () => {
      const code = 'function greet(name):\n    return f"Hello {name}"';
      const result = validateCode('test.py', code);
      expect(result.warnings.some((w) => w.includes('function'))).toBe(true);
    });

    it('should pass valid Python code', () => {
      const code = `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(result)
      `;
      const result = validateCode('factorial.py', code);
      expect(result.isValid).toBe(true);
    });

    it('should handle Python classes', () => {
      const code = `
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"Hello, {self.name}!"
      `;
      const result = validateCode('user.py', code);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCode - JSON', () => {
    it('should detect invalid JSON', () => {
      const code = '{ "name": "test", invalid }';
      const result = validateCode('config.json', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid JSON'))).toBe(true);
    });

    it('should pass valid JSON', () => {
      const code = `{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}`;
      const result = validateCode('package.json', code);
      expect(result.isValid).toBe(true);
    });

    it('should detect trailing commas', () => {
      const code = '{ "name": "test", }';
      const result = validateCode('config.json', code);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCode - Complex scenarios', () => {
    it('should handle nested structures', () => {
      const code = `
const obj = {
  nested: {
    deep: {
      value: [1, 2, [3, 4]]
    }
  }
};
      `;
      const result = validateCode('nested.js', code);
      expect(result.isValid).toBe(true);
    });

    it('should handle JSX syntax', () => {
      const code = `
export function Button({ children, onClick }) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}
      `;
      const result = validateCode('Button.jsx', code);
      expect(result.isValid).toBe(true);
    });

    it('should detect multiple errors', () => {
      const code = `
function test( {
  const x = [1, 2, 3;
  // rest of code here
}
      `;
      const result = validateCode('test.js', code);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
