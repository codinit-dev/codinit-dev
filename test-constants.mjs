// Test script to verify constants work correctly
import { getProviderList, getDefaultProvider, PROVIDER_LIST, DEFAULT_PROVIDER } from './app/utils/constants.ts';

console.log('Client-side PROVIDER_LIST length:', PROVIDER_LIST.length);
console.log('Client-side getProviderList() available:', typeof getProviderList);
console.log('Client-side DEFAULT_PROVIDER:', DEFAULT_PROVIDER);

// Test server-side functions (these should work when called on server)
try {
  const serverProviders = getProviderList();
  const serverDefault = getDefaultProvider();
  console.log('Server-side getProviderList() length:', serverProviders.length);
  console.log('Server-side getDefaultProvider():', serverDefault?.name);
} catch (e) {
  console.log('Server-side functions not available in this context:', e.message);
}
