import type { WebContainer } from '@webcontainer/api';
import type { Message } from 'ai';

type CodinitDebug = {
  messages?: Message[];
  parsedMessages?: Message[];
  webcontainer?: WebContainer;
  setLogLevel?: (level: any) => void;
  chatInitialId?: string;
  sessionId?: string;
};

export function setCodinitDebugProperty(key: keyof CodinitDebug, value: CodinitDebug[keyof CodinitDebug]) {
  if (typeof window === 'undefined') {
    console.warn('setCodinitDebugProperty called on server, ignoring');
    return;
  }
  (window as any).__CHEF_DEBUG = (window as any).__CHEF_DEBUG || {};
  (window as any).__CHEF_DEBUG[key] = value;
}
