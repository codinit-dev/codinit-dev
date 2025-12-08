import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('CodeValidator');

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCode(filePath: string, content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (content.includes('// rest of code here') || content.includes('// ... rest of code')) {
    errors.push('Code contains placeholder comment "// rest of code here"');
  }

  if (content.includes('/* ... */') || content.includes('// ...')) {
    errors.push('Code contains ellipsis placeholders');
  }

  if (content.includes('```')) {
    warnings.push('File contains markdown code block syntax (```)');
  }

  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
    validateJavaScript(content, errors, warnings);
  } else if (ext === 'py') {
    validatePython(content, errors, warnings);
  } else if (ext === 'json') {
    validateJSON(content, errors);
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.warn(`Validation failed for ${filePath}:`, errors);
  }

  if (warnings.length > 0) {
    logger.debug(`Validation warnings for ${filePath}:`, warnings);
  }

  return { isValid, errors, warnings };
}

function validateJavaScript(content: string, errors: string[], _warnings: string[]): void {
  const lines = content.split('\n');

  let openBraces = 0;
  let openParens = 0;
  let openBrackets = 0;

  for (const line of lines) {
    const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');

    for (const char of cleanLine) {
      if (char === '{') {
        openBraces++;
      } else if (char === '}') {
        openBraces--;
      } else if (char === '(') {
        openParens++;
      } else if (char === ')') {
        openParens--;
      } else if (char === '[') {
        openBrackets++;
      } else if (char === ']') {
        openBrackets--;
      }
    }
  }

  if (openBraces !== 0) {
    errors.push(`Mismatched braces: ${openBraces > 0 ? 'unclosed' : 'extra closing'} braces`);
  }

  if (openParens !== 0) {
    errors.push(`Mismatched parentheses: ${openParens > 0 ? 'unclosed' : 'extra closing'} parentheses`);
  }

  if (openBrackets !== 0) {
    errors.push(`Mismatched brackets: ${openBrackets > 0 ? 'unclosed' : 'extra closing'} brackets`);
  }

  if (content.includes('import from') || content.includes('from import')) {
    errors.push('Incorrect import syntax - mixing JavaScript and Python syntax');
  }
}

function validatePython(content: string, errors: string[], warnings: string[]): void {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    const indent = line.length - trimmed.length;

    if (line.includes('\t')) {
      warnings.push(`Line ${i + 1}: Contains tabs instead of spaces`);
    }

    if (indent % 4 !== 0 && indent % 2 !== 0) {
      warnings.push(`Line ${i + 1}: Inconsistent indentation`);
    }
  }

  if (content.includes('const ') || content.includes('let ') || content.includes('var ')) {
    errors.push('JavaScript variable declarations found in Python file');
  }

  if (content.includes('function ') && !content.includes('def ')) {
    warnings.push('Using "function" keyword - did you mean "def"?');
  }
}

function validateJSON(content: string, errors: string[]): void {
  try {
    JSON.parse(content);
  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
  }
}
