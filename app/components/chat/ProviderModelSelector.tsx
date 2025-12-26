import type { ProviderInfo } from '~/types/model';
import { useEffect, useState, useRef } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { classNames } from '~/utils/classNames';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { TextShimmer } from '~/components/ui/text-shimmer';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';

interface ProviderModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
  isCollapsed?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onApiKeyChange?: (providerName: string, apiKey: string) => void;
}

export const ProviderModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
  isCollapsed,
  open,
  onOpenChange,
  apiKeys,
  onApiKeyChange,
}: ProviderModelSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDropdownOpen = open !== undefined ? open : internalOpen;
  const setIsDropdownOpen = onOpenChange || setInternalOpen;

  // Get current model info
  const currentModel = modelList.find((m) => m.name === model);

  // Filter providers based on search
  const filteredProviders = providerList.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handle model selection (also sets provider)
  const handleModelSelect = (selectedModel: ModelInfo) => {
    // Find the provider for this model
    const modelProvider = providerList.find((p) => p.name === selectedModel.provider);

    if (modelProvider && setProvider) {
      setProvider(modelProvider);
    }

    if (setModel) {
      setModel(selectedModel.name);
    }

    setSearchQuery('');
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isDropdownOpen]);

  // Auto-select first provider and model if none selected
  useEffect(() => {
    if (providerList.length === 0) {
      return;
    }

    if (!provider || !providerList.some((p) => p.name === provider.name)) {
      const firstEnabledProvider = providerList[0];
      setProvider?.(firstEnabledProvider);

      const firstModel = modelList.find((m) => m.provider === firstEnabledProvider.name);

      if (firstModel) {
        setModel?.(firstModel.name);
      }
    }
  }, [providerList, provider, setProvider, modelList, setModel]);

  if (providerList.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-codinit-elements-borderColor bg-codinit-elements-prompt-background text-codinit-elements-textPrimary">
        <p className="text-center">
          No providers are currently enabled. Please enable at least one provider in the settings to start using the
          chat.
        </p>
      </div>
    );
  }

  const displayText = provider && currentModel ? `${provider.name} / ${currentModel.label}` : 'Select provider / model';

  const dropdownContent = (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className={classNames(
          'min-w-[300px] rounded-lg p-2',
          'bg-codinit-elements-background-depth-2',
          'border border-codinit-elements-borderColor',
          'shadow-lg',
          'animate-in fade-in-80 zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          'z-[1000]',
        )}
        side={isCollapsed ? 'top' : 'bottom'}
        sideOffset={8}
        align="start"
        alignOffset={0}
        collisionPadding={8}
        avoidCollisions={true}
      >
        {/* Search Input */}
        <div className="px-2 pb-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search providers..."
              className={classNames(
                'w-full pl-8 py-1.5 rounded-md text-sm',
                'bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor',
                'text-codinit-elements-textPrimary placeholder:text-codinit-elements-textTertiary',
                'focus:outline-none focus:ring-2 focus:ring-codinit-elements-focus',
                'transition-all',
              )}
              onClick={(e) => e.stopPropagation()}
              role="searchbox"
              aria-label="Search providers"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <span className="i-ph:magnifying-glass text-codinit-elements-textTertiary" />
            </div>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredProviders.length === 0 ? (
            <div className="px-3 py-2 text-sm text-codinit-elements-textTertiary">No providers found</div>
          ) : (
            filteredProviders.map((providerOption) => {
              // Get models for this provider
              const providerModels = modelList.filter((m) => m.provider === providerOption.name && m.name);

              return (
                <div key={providerOption.name}>
                  {/* Provider Header */}
                  <div
                    className={classNames(
                      'flex items-center gap-2 px-3 py-2 text-sm',
                      'text-codinit-elements-textPrimary',
                      'bg-codinit-elements-background-depth-1',
                      'border-b border-codinit-elements-borderColor',
                    )}
                  >
                    {providerOption.icon && (
                      <img src={providerOption.icon} alt={providerOption.name} className="w-5 h-5" />
                    )}
                    <span className="font-medium">{providerOption.name}</span>
                  </div>

                  {/* Models for this provider */}
                  {providerModels.length > 0 && (
                    <div className="ml-6">
                      {modelLoading === 'all' || modelLoading === providerOption.name ? (
                        <div className="px-3 py-1 text-xs">
                          <TextShimmer>Loading...</TextShimmer>
                        </div>
                      ) : (
                        providerModels.map((modelOption) => (
                          <DropdownMenu.Item
                            key={modelOption.name}
                            className={classNames(
                              'flex items-center gap-2 px-3 py-1 text-xs cursor-pointer',
                              'hover:bg-codinit-elements-background-depth-3',
                              'text-codinit-elements-textSecondary',
                              'outline-none rounded-md',
                              model === modelOption.name
                                ? 'bg-codinit-elements-background-depth-2 text-codinit-elements-textPrimary'
                                : undefined,
                            )}
                            onSelect={() => handleModelSelect(modelOption)}
                          >
                            {modelOption.icon && (
                              <img src={modelOption.icon} alt={modelOption.label} className="w-4 h-4" />
                            )}
                            <span>{modelOption.label}</span>
                            {model === modelOption.name && <div className="ml-auto i-ph:check text-xs" />}
                          </DropdownMenu.Item>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* API Key Manager for collapsed mode */}
        {isCollapsed && provider && !LOCAL_PROVIDERS.includes(provider.name) && onApiKeyChange && (
          <div className="px-2 pt-2 border-t border-codinit-elements-borderColor mt-2">
            <APIKeyManager
              provider={provider}
              apiKey={apiKeys[provider.name] || ''}
              setApiKey={(key) => onApiKeyChange(provider.name, key)}
            />
          </div>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );

  if (isCollapsed) {
    return dropdownContent;
  }

  return (
    <DropdownMenu.Root open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-controls="provider-model-listbox"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          className={classNames(
            'flex w-full items-center justify-between rounded-md',
            'border border-codinit-elements-borderColor',
            'placeholder:text-codinit-elements-textTertiary',
            'focus:outline-none focus:ring-2 focus:ring-codinit-elements-focus',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&>span]:line-clamp-1 whitespace-nowrap',
            'border-none shadow-none focus:ring-0',
            'px-0 py-0 h-6 text-xs bg-transparent text-codinit-elements-textPrimary',
            'cursor-pointer',
          )}
        >
          <span style={{ pointerEvents: 'none' }}>
            <div className="flex items-center space-x-2">
              {provider?.icon && (
                <img
                  alt={provider.name}
                  loading="lazy"
                  width="14"
                  height="14"
                  decoding="async"
                  className="flex"
                  src={provider.icon}
                  style={{ color: 'transparent' }}
                />
              )}
              <span className="text-codinit-elements-textPrimary">{displayText}</span>
            </div>
          </span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pl-1 h-4 w-4 opacity-50 text-codinit-elements-textSecondary"
            aria-hidden="true"
          >
            <path
              d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      {dropdownContent}
    </DropdownMenu.Root>
  );
};
