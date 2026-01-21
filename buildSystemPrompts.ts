#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { ROLE_SYSTEM_PROMPT, generalSystemPrompt } from './codinit-agent/prompts/system.js';
import type { SystemPromptOptions } from './codinit-agent/types.js';

console.log('Building codinit system prompts release...');

const defaultOptions: SystemPromptOptions = {
  enableBulkEdits: true,
  includeTemplate: true,
  openaiProxyEnabled: true,
  usingOpenAi: true,
  usingGoogle: true,
  resendProxyEnabled: true,
  enableResend: true,
};

let output: string = `# Codinit System Prompts\n`;
output += `Generated on: ${new Date().toISOString()}\n`;
output += `========================================\n\n`;
output += `This file contains the system prompts sent to Codinit.\n\n`;

output += `## System Message 1: ROLE_SYSTEM_PROMPT\n\n`;
output += ROLE_SYSTEM_PROMPT + '\n\n';
output += `---\n\n`;

output += `## System Message 2: General System Prompt\n\n`;
try {
  const generalPromptContent = generalSystemPrompt(defaultOptions);
  output += generalPromptContent + '\n\n';
  output += `---\n\n`;
} catch (error: unknown) {
  const errorMessage: string = error instanceof Error ? error.message : String(error);
  console.log(`Could not generate general system prompt: ${errorMessage}`);
}

writeFileSync('codinit-system-prompts.txt', output);
console.log('✅ Built codinit-system-prompts.txt');
