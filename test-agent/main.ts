import { anthropic } from '@ai-sdk/anthropic';
import { codinitTask } from './codinitTask.js';
import type { CodinitModel } from './types.js';
import { mkdirSync } from 'fs';
import { codinitSetLogLevel } from 'codinit-agent/utils/logger.js';

codinitSetLogLevel('info');

const model: CodinitModel = {
  name: 'claude-4-sonnet',
  model_slug: 'claude-sonnet-4-20250514',
  ai: anthropic('claude-sonnet-4-20250514'),
  maxTokens: 16384,
};
mkdirSync('/tmp/backend', { recursive: true });
const result = await codinitTask(model, '/tmp/backend', 'Make me a chat app');
console.log(result);
