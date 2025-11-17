// Test helpers and utilities

import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Custom render function that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Mock LLM provider responses
export const mockLLMResponse = (content: string, model = 'gpt-4o') => ({
  id: 'chatcmpl-test',
  object: 'chat.completion',
  created: Date.now(),
  model,
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content,
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
});

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers({ 'content-type': 'application/json' }),
});

// Create mock file system for testing
export const createMockFileSystem = (structure: Record<string, any>) => {
  const mockFS: Record<string, any> = {};

  const buildFS = (obj: Record<string, any>, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}/${key}` : key;

      if (value && typeof value === 'object' && value.type === 'file') {
        mockFS[fullPath] = value.content;
      } else if (value && typeof value === 'object' && value.type === 'directory') {
        buildFS(value.children, fullPath);
      }
    }
  };

  buildFS(structure);

  return mockFS;
};

// Generate test IDs for components
export const testIds = {
  modelSelector: 'model-selector',
  providerDropdown: 'provider-dropdown',
  modelDropdown: 'model-dropdown',
  chatInput: 'chat-input',
  sendButton: 'send-button',
  messageList: 'message-list',
  fileTree: 'file-tree',
  editor: 'editor',
  terminal: 'terminal',
  settingsPanel: 'settings-panel',
};

// Common test data generators
export const generateTestMessage = (overrides = {}) => ({
  id: `msg-${Date.now()}`,
  role: 'user',
  content: 'Test message',
  createdAt: new Date(),
  ...overrides,
});

export const generateTestModel = (overrides = {}) => ({
  name: 'gpt-4o',
  label: 'GPT-4o',
  provider: 'OpenAI',
  maxTokenAllowed: 128000,
  maxCompletionTokens: 4096,
  ...overrides,
});

export const generateTestProvider = (overrides = {}) => ({
  name: 'OpenAI',
  staticModels: [],
  getApiKeyLink: 'https://platform.openai.com/api-keys',
  labelForGetApiKey: 'Get API Key',
  icon: '/thirdparty/logos/openai.svg',
  ...overrides,
});

// Wait for async operations
export const waitForAsync = () => new Promise((resolve) => setImmediate(resolve));

// Mock console methods for cleaner test output
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mockMethods: (keyof typeof console)[] = ['log', 'warn', 'error', 'info', 'debug'];

  mockMethods.forEach((method) => {
    (console[method] as any) = vi.fn();
  });

  return {
    restore: () => {
      mockMethods.forEach((method) => {
        (console[method] as any) = originalConsole[method];
      });
    },
  };
};

// Create test wrapper with common setup
export const createTestWrapper = (component: React.ComponentType<any>) => {
  const Component = component;
  return (props: any) => (
    <AllTheProviders>
      <Component {...props} />
    </AllTheProviders>
  );
};

export { customRender as render };
