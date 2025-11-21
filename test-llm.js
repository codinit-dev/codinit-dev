// Simple test to verify constants work
import { LLMManager } from './app/lib/modules/llm/manager.ts';

console.log('Testing LLMManager...');

try {
  const manager = LLMManager.getInstance({});
  console.log('Providers registered:', manager.getAllProviders().length);
  console.log('Default provider:', manager.getDefaultProvider()?.name);
  console.log('✅ LLMManager works correctly');
} catch (e) {
  console.log('❌ LLMManager failed:', e.message);
}
