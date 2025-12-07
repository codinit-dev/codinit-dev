import { useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { SettingsSection } from '~/components/@settings/shared/components/SettingsCard';
import { SettingsPanel, SettingsList, SettingsListItem } from '~/components/@settings/shared/components/SettingsPanel';

interface ProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  apiKeyPlaceholder: string;
  getApiKeyUrl?: string;
  category: 'cloud' | 'local';
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'Anthropic',
    displayName: 'Anthropic (Claude)',
    icon: '/thirdparty/logos/anthropic.svg',
    apiKeyPlaceholder: 'sk-ant-...',
    getApiKeyUrl: 'https://console.anthropic.com/',
    category: 'cloud',
  },
  {
    name: 'OpenAI',
    displayName: 'OpenAI',
    icon: '/thirdparty/logos/openai.svg',
    apiKeyPlaceholder: 'sk-...',
    getApiKeyUrl: 'https://platform.openai.com/api-keys',
    category: 'cloud',
  },
  {
    name: 'Google',
    displayName: 'Google (Gemini)',
    icon: '/thirdparty/logos/gemini.svg',
    apiKeyPlaceholder: 'AI...',
    getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
    category: 'cloud',
  },
  {
    name: 'Groq',
    displayName: 'Groq',
    icon: '/thirdparty/logos/groq.svg',
    apiKeyPlaceholder: 'gsk_...',
    getApiKeyUrl: 'https://console.groq.com/keys',
    category: 'cloud',
  },
  {
    name: 'xAI',
    displayName: 'xAI (Grok)',
    icon: '/thirdparty/logos/xai.svg',
    apiKeyPlaceholder: 'xai-...',
    getApiKeyUrl: 'https://console.x.ai/',
    category: 'cloud',
  },
  {
    name: 'Deepseek',
    displayName: 'Deepseek',
    icon: '/thirdparty/logos/deepseek.svg',
    apiKeyPlaceholder: 'sk-...',
    getApiKeyUrl: 'https://platform.deepseek.com/api_keys',
    category: 'cloud',
  },
  {
    name: 'Mistral',
    displayName: 'Mistral AI',
    icon: '/thirdparty/logos/mistral.svg',
    apiKeyPlaceholder: '...',
    getApiKeyUrl: 'https://console.mistral.ai/api-keys',
    category: 'cloud',
  },
  {
    name: 'Moonshot',
    displayName: 'Moonshot AI',
    icon: '/thirdparty/logos/moonshot.svg',
    apiKeyPlaceholder: 'sk-...',
    getApiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    category: 'cloud',
  },
  {
    name: 'OpenRouter',
    displayName: 'OpenRouter',
    icon: '/thirdparty/logos/openrouter.svg',
    apiKeyPlaceholder: 'sk-or-...',
    getApiKeyUrl: 'https://openrouter.ai/keys',
    category: 'cloud',
  },
  {
    name: 'Perplexity',
    displayName: 'Perplexity',
    icon: '/thirdparty/logos/perplexity.svg',
    apiKeyPlaceholder: 'pplx-...',
    getApiKeyUrl: 'https://www.perplexity.ai/settings/api',
    category: 'cloud',
  },
  {
    name: 'Together',
    displayName: 'Together AI',
    icon: '/thirdparty/logos/togetherai.svg',
    apiKeyPlaceholder: '...',
    getApiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    category: 'cloud',
  },
  {
    name: 'HuggingFace',
    displayName: 'Hugging Face',
    icon: '/thirdparty/logos/huggingface.svg',
    apiKeyPlaceholder: 'hf_...',
    getApiKeyUrl: 'https://huggingface.co/settings/tokens',
    category: 'cloud',
  },
  {
    name: 'Hyperbolic',
    displayName: 'Hyperbolic',
    icon: '/thirdparty/logos/hyperbolic.svg',
    apiKeyPlaceholder: '...',
    getApiKeyUrl: 'https://app.hyperbolic.xyz/settings',
    category: 'cloud',
  },
  {
    name: 'AmazonBedrock',
    displayName: 'Amazon Bedrock',
    icon: '/thirdparty/logos/bedrock.svg',
    apiKeyPlaceholder: 'Access Key ID',
    getApiKeyUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    category: 'cloud',
  },
  {
    name: 'Github',
    displayName: 'GitHub Models',
    icon: '/thirdparty/logos/github.svg',
    apiKeyPlaceholder: 'ghp_...',
    getApiKeyUrl: 'https://github.com/settings/tokens',
    category: 'cloud',
  },
];

export default function ApiKeysTab() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [editingKeys, setEditingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedKeys = Cookies.get('apiKeys');

    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Failed to parse API keys from cookies:', e);
      }
    }
  }, []);

  const handleSaveKey = (providerName: string, key: string) => {
    const updatedKeys = { ...apiKeys, [providerName]: key };
    setApiKeys(updatedKeys);
    Cookies.set('apiKeys', JSON.stringify(updatedKeys), { expires: 365 });
    setEditingKeys({ ...editingKeys, [providerName]: false });
    toast.success(`${providerName} API key saved`);
  };

  const handleDeleteKey = (providerName: string) => {
    const updatedKeys = { ...apiKeys };
    delete updatedKeys[providerName];
    setApiKeys(updatedKeys);
    Cookies.set('apiKeys', JSON.stringify(updatedKeys), { expires: 365 });
    toast.success(`${providerName} API key removed`);
  };

  const toggleVisibility = (providerName: string) => {
    setVisibleKeys({ ...visibleKeys, [providerName]: !visibleKeys[providerName] });
  };

  const toggleEditing = (providerName: string) => {
    setEditingKeys({ ...editingKeys, [providerName]: !editingKeys[providerName] });
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) {
      return '•'.repeat(key.length);
    }

    return key.slice(0, 3) + '•'.repeat(key.length - 7) + key.slice(-4);
  };

  const cloudProviders = PROVIDERS.filter((p) => p.category === 'cloud');

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Cloud Provider API Keys"
        description="Configure your API keys for cloud-based LLM providers"
        icon="i-ph:cloud-fill"
        delay={0.1}
      >
        <SettingsPanel variant="section" className="p-6">
          <div className="mb-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/20">
            <div className="flex items-start gap-3">
              <div className="i-ph:info w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-codinit-elements-textSecondary">
                <p className="font-medium text-codinit-elements-textPrimary mb-1">API Key Storage</p>
                <p>
                  API keys are stored securely in browser cookies and are never sent to our servers. They are only used
                  to authenticate with the respective AI providers.
                </p>
              </div>
            </div>
          </div>

          <SettingsList>
            {cloudProviders.map((provider) => {
              const hasKey = !!apiKeys[provider.name];
              const isVisible = visibleKeys[provider.name];
              const isEditing = editingKeys[provider.name];

              return (
                <SettingsListItem key={provider.name}>
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={classNames(
                        'flex-shrink-0 w-12 h-12 rounded-xl',
                        'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/20',
                        'flex items-center justify-center',
                        'ring-2 ring-blue-200/30 dark:ring-blue-800/20',
                        'transition-all duration-300',
                      )}
                    >
                      <img src={provider.icon} alt={provider.displayName} className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-codinit-elements-textPrimary text-base">
                          {provider.displayName}
                        </h4>
                        {hasKey && !isEditing && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 font-medium">
                            Configured
                          </span>
                        )}
                      </div>

                      {isEditing || !hasKey ? (
                        <div className="flex items-center gap-2">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            placeholder={provider.apiKeyPlaceholder}
                            defaultValue={apiKeys[provider.name] || ''}
                            className={classNames(
                              'flex-1 px-3 py-2 rounded-lg text-sm',
                              'bg-white dark:bg-[#0F0F0F]',
                              'border border-gray-200 dark:border-[#2A2A2A]',
                              'text-codinit-elements-textPrimary',
                              'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
                            )}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveKey(provider.name, e.currentTarget.value);
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value) {
                                handleSaveKey(provider.name, e.target.value);
                              } else if (!hasKey) {
                                setEditingKeys({ ...editingKeys, [provider.name]: false });
                              }
                            }}
                          />
                          <button
                            onClick={() => toggleVisibility(provider.name)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div
                              className={classNames(
                                isVisible ? 'i-ph:eye-slash' : 'i-ph:eye',
                                'w-4 h-4 text-gray-500 dark:text-gray-400',
                              )}
                            />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0F0F0F] text-sm font-mono text-codinit-elements-textSecondary">
                            {maskApiKey(apiKeys[provider.name])}
                          </code>
                          <button
                            onClick={() => toggleEditing(provider.name)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit API Key"
                          >
                            <div className="i-ph:pencil w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteKey(provider.name)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete API Key"
                          >
                            <div className="i-ph:trash w-4 h-4 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      )}

                      {provider.getApiKeyUrl && (
                        <a
                          href={provider.getApiKeyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Get API Key</span>
                          <div className="i-ph:arrow-square-out w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </SettingsListItem>
              );
            })}
          </SettingsList>
        </SettingsPanel>
      </SettingsSection>
    </div>
  );
}
