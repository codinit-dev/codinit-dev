// Test fixtures for API responses and mock data

export const mockOpenAIModels = {
  data: [
    {
      id: 'gpt-4o',
      object: 'model',
      created: 1687882411,
      owned_by: 'openai',
    },
    {
      id: 'gpt-4o-mini',
      object: 'model',
      created: 1687882410,
      owned_by: 'openai',
    },
    {
      id: 'gpt-3.5-turbo',
      object: 'model',
      created: 1677610602,
      owned_by: 'openai',
    },
  ],
};

export const mockAnthropicModels = {
  data: [
    {
      id: 'claude-3-5-sonnet-20241022',
      display_name: 'Claude 3.5 Sonnet',
      type: 'model',
    },
    {
      id: 'claude-3-haiku-20240307',
      display_name: 'Claude 3 Haiku',
      type: 'model',
    },
  ],
};

export const mockModelInfo = {
  openai: [
    {
      name: 'gpt-4o',
      label: 'GPT-4o',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },
    {
      name: 'gpt-4o-mini',
      label: 'GPT-4o Mini',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },
  ],
  anthropic: [
    {
      name: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 8192,
    },
  ],
};

export const mockProviderInfo = [
  {
    name: 'OpenAI',
    staticModels: mockModelInfo.openai,
    getApiKeyLink: 'https://platform.openai.com/api-keys',
    labelForGetApiKey: 'Get API Key',
    icon: '/thirdparty/logos/openai.svg',
  },
  {
    name: 'Anthropic',
    staticModels: mockModelInfo.anthropic,
    getApiKeyLink: 'https://console.anthropic.com/',
    labelForGetApiKey: 'Get API Key',
    icon: '/thirdparty/logos/anthropic.svg',
  },
];

export const mockApiKeys = {
  openai: 'sk-test123456789',
  anthropic: 'sk-ant-test123456789',
};

export const mockChatMessages = [
  {
    id: '1',
    role: 'user',
    content: 'Hello, can you help me write a React component?',
  },
  {
    id: '2',
    role: 'assistant',
    content:
      "Of course! I'd be happy to help you write a React component. What kind of component are you looking to create?",
  },
];

export const mockFileSystem = {
  '/app': {
    type: 'directory',
    children: {
      src: {
        type: 'directory',
        children: {
          components: {
            type: 'directory',
            children: {
              'Button.tsx': {
                type: 'file',
                content: 'export const Button = () => <button>Click me</button>;',
              },
              'Input.tsx': {
                type: 'file',
                content: 'export const Input = () => <input type="text" />;',
              },
            },
          },
          'App.tsx': {
            type: 'file',
            content: 'import React from "react";\n\nexport const App = () => <div>Hello World</div>;',
          },
        },
      },
      'package.json': {
        type: 'file',
        content: JSON.stringify(
          {
            name: 'test-app',
            version: '1.0.0',
            dependencies: {
              react: '^18.0.0',
            },
          },
          null,
          2,
        ),
      },
    },
  },
};

export const mockDeploymentConfig = {
  netlify: {
    siteId: 'test-site-id',
    buildCommand: 'npm run build',
    publishDirectory: 'dist',
    environment: {
      NODE_ENV: 'production',
    },
  },
  vercel: {
    projectId: 'test-project-id',
    orgId: 'test-org-id',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
  },
};

export const mockGitInfo = {
  branch: 'main',
  commitHash: 'abc123def456',
  remoteUrl: 'https://github.com/user/repo.git',
  author: 'Test Author',
  email: 'test@example.com',
};

export const mockSystemInfo = {
  platform: 'darwin',
  arch: 'arm64',
  version: '22.1.0',
  hostname: 'test-machine',
  cpus: 8,
  memory: {
    total: 16 * 1024 * 1024 * 1024, // 16GB
    free: 8 * 1024 * 1024 * 1024, // 8GB
  },
  disk: {
    total: 500 * 1024 * 1024 * 1024, // 500GB
    free: 200 * 1024 * 1024 * 1024, // 200GB
  },
};
