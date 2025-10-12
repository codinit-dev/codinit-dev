import type { ProviderInfo } from '~/types/model';
import { useEffect, useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { classNames } from '~/utils/classNames';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
}: ModelSelectorProps) => {
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [focusedModelIndex, setFocusedModelIndex] = useState(-1);
  const modelSearchInputRef = useRef<HTMLInputElement>(null);
  const modelOptionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [focusedProviderIndex, setFocusedProviderIndex] = useState(-1);
  const providerSearchInputRef = useRef<HTMLInputElement>(null);
  const providerOptionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
        setModelSearchQuery('');
      }

      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setIsProviderDropdownOpen(false);
        setProviderSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredModels = [...modelList]
    .filter((e) => e.provider === provider?.name && e.name)
    .filter(
      (model) =>
        model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()),
    );

  const filteredProviders = providerList.filter((p) =>
    p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    setFocusedModelIndex(-1);
  }, [modelSearchQuery, isModelDropdownOpen]);

  useEffect(() => {
    setFocusedProviderIndex(-1);
  }, [providerSearchQuery, isProviderDropdownOpen]);

  useEffect(() => {
    if (isModelDropdownOpen && modelSearchInputRef.current) {
      modelSearchInputRef.current.focus();
    }
  }, [isModelDropdownOpen]);

  useEffect(() => {
    if (isProviderDropdownOpen && providerSearchInputRef.current) {
      providerSearchInputRef.current.focus();
    }
  }, [isProviderDropdownOpen]);

  const handleModelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isModelDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedModelIndex((prev) => (prev + 1 >= filteredModels.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedModelIndex((prev) => (prev - 1 < 0 ? filteredModels.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedModelIndex >= 0 && focusedModelIndex < filteredModels.length) {
          const selectedModel = filteredModels[focusedModelIndex];
          setModel?.(selectedModel.name);
          setIsModelDropdownOpen(false);
          setModelSearchQuery('');
        }

        break;
      case 'Escape':
        e.preventDefault();
        setIsModelDropdownOpen(false);
        setModelSearchQuery('');
        break;
      case 'Tab':
        if (!e.shiftKey && focusedModelIndex === filteredModels.length - 1) {
          setIsModelDropdownOpen(false);
        }

        break;
    }
  };

  const handleProviderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isProviderDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedProviderIndex((prev) => (prev + 1 >= filteredProviders.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedProviderIndex((prev) => (prev - 1 < 0 ? filteredProviders.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedProviderIndex >= 0 && focusedProviderIndex < filteredProviders.length) {
          const selectedProvider = filteredProviders[focusedProviderIndex];

          if (setProvider) {
            setProvider(selectedProvider);

            const firstModel = modelList.find((m) => m.provider === selectedProvider.name);

            if (firstModel && setModel) {
              setModel(firstModel.name);
            }
          }

          setIsProviderDropdownOpen(false);
          setProviderSearchQuery('');
        }

        break;
      case 'Escape':
        e.preventDefault();
        setIsProviderDropdownOpen(false);
        setProviderSearchQuery('');
        break;
      case 'Tab':
        if (!e.shiftKey && focusedProviderIndex === filteredProviders.length - 1) {
          setIsProviderDropdownOpen(false);
        }

        break;
    }
  };

  useEffect(() => {
    if (focusedModelIndex >= 0 && modelOptionsRef.current[focusedModelIndex]) {
      modelOptionsRef.current[focusedModelIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [focusedModelIndex]);

  useEffect(() => {
    if (focusedProviderIndex >= 0 && providerOptionsRef.current[focusedProviderIndex]) {
      providerOptionsRef.current[focusedProviderIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [focusedProviderIndex]);

  useEffect(() => {
    if (providerList.length === 0) {
      return;
    }

    if (provider && !providerList.some((p) => p.name === provider.name)) {
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

  return (
    <div className="flex gap-2 flex-col sm:flex-row">
      {/* Provider Combobox */}
      <div className="relative flex w-full z-50" onKeyDown={handleProviderKeyDown} ref={providerDropdownRef}>
        <div
          className={classNames(
            'w-full px-3 py-2 rounded-lg cursor-pointer',
            'bg-codinit-elements-background-depth-1/30 backdrop-blur-sm',
            'border border-codinit-elements-borderColor/40',
            'text-codinit-elements-textPrimary',
            'transition-all duration-200 ease-in-out',
            'hover:border-codinit-elements-borderColor/70 hover:bg-codinit-elements-background-depth-1/50',
            isProviderDropdownOpen
              ? 'ring-2 ring-accent-500/30 border-accent-500/50 shadow-lg shadow-accent-500/5'
              : 'shadow-sm',
          )}
          onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsProviderDropdownOpen(!isProviderDropdownOpen);
            }
          }}
          role="combobox"
          aria-expanded={isProviderDropdownOpen}
          aria-controls="provider-listbox"
          aria-haspopup="listbox"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              {provider?.icon && (
                <img src={provider.icon} alt={provider.name} className="w-4 h-4 flex-shrink-0 rounded" />
              )}
              <span className="truncate font-medium text-xs">{provider?.name || 'Select provider'}</span>
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-3.5 h-3.5 text-codinit-elements-textSecondary transition-transform duration-200',
                isProviderDropdownOpen ? 'rotate-180' : undefined,
              )}
            />
          </div>
        </div>

        {isProviderDropdownOpen && (
          <div
            className="absolute top-full z-[100] w-full mt-1 py-1.5 rounded-lg border border-codinit-elements-borderColor/50 bg-codinit-elements-background-depth-2 backdrop-blur-xl shadow-2xl shadow-black/20"
            role="listbox"
            id="provider-listbox"
          >
            <div className="px-2 pb-1.5">
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="i-ph:magnifying-glass text-codinit-elements-textTertiary text-xs" />
                </div>
                <input
                  ref={providerSearchInputRef}
                  type="text"
                  value={providerSearchQuery}
                  onChange={(e) => setProviderSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={classNames(
                    'w-full pl-7 pr-2 py-1.5 rounded-md text-xs',
                    'bg-codinit-elements-background-depth-1/50 border border-codinit-elements-borderColor/40',
                    'text-codinit-elements-textPrimary placeholder:text-codinit-elements-textTertiary/60',
                    'focus:outline-none focus:ring-1 focus:ring-accent-500/30 focus:border-accent-500/50',
                    'transition-all duration-150',
                  )}
                  onClick={(e) => e.stopPropagation()}
                  role="searchbox"
                  aria-label="Search providers"
                />
              </div>
            </div>

            <div
              className={classNames(
                'max-h-48 overflow-y-auto px-0.5',
                'sm:scrollbar-none',
                '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5',
                '[&::-webkit-scrollbar-thumb]:bg-codinit-elements-borderColor/50',
                '[&::-webkit-scrollbar-thumb]:hover:bg-codinit-elements-borderColor',
                '[&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-track]:rounded-full',
              )}
            >
              {filteredProviders.length === 0 ? (
                <div className="px-3 py-2 text-xs text-codinit-elements-textTertiary/70 text-center">
                  No providers found
                </div>
              ) : (
                filteredProviders.map((providerOption, index) => (
                  <div
                    ref={(el) => (providerOptionsRef.current[index] = el)}
                    key={providerOption.name}
                    role="option"
                    aria-selected={provider?.name === providerOption.name}
                    className={classNames(
                      'px-2.5 py-1.5 mx-1 mb-0.5 text-xs cursor-pointer rounded-md',
                      'transition-all duration-150 ease-in-out',
                      'outline-none',
                      provider?.name === providerOption.name
                        ? 'bg-accent-500/10 text-accent-500 font-medium'
                        : 'text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-3/50',
                      focusedProviderIndex === index ? 'ring-1 ring-inset ring-accent-500/30' : undefined,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (setProvider) {
                        setProvider(providerOption);

                        const firstModel = modelList.find((m) => m.provider === providerOption.name);

                        if (firstModel && setModel) {
                          setModel(firstModel.name);
                        }
                      }

                      setIsProviderDropdownOpen(false);
                      setProviderSearchQuery('');
                    }}
                    tabIndex={focusedProviderIndex === index ? 0 : -1}
                  >
                    <div className="flex items-center gap-2">
                      {providerOption.icon && (
                        <img
                          src={providerOption.icon}
                          alt={providerOption.name}
                          className="w-3.5 h-3.5 flex-shrink-0 rounded"
                        />
                      )}
                      <span className="truncate">{providerOption.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Model Combobox */}
      <div className="relative flex w-full min-w-[70%] z-50" onKeyDown={handleModelKeyDown} ref={modelDropdownRef}>
        <div
          className={classNames(
            'w-full px-3 py-2 rounded-lg cursor-pointer',
            'bg-codinit-elements-background-depth-1/30 backdrop-blur-sm',
            'border border-codinit-elements-borderColor/40',
            'text-codinit-elements-textPrimary',
            'transition-all duration-200 ease-in-out',
            'hover:border-codinit-elements-borderColor/70 hover:bg-codinit-elements-background-depth-1/50',
            isModelDropdownOpen
              ? 'ring-2 ring-accent-500/30 border-accent-500/50 shadow-lg shadow-accent-500/5'
              : 'shadow-sm',
          )}
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsModelDropdownOpen(!isModelDropdownOpen);
            }
          }}
          role="combobox"
          aria-expanded={isModelDropdownOpen}
          aria-controls="model-listbox"
          aria-haspopup="listbox"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div className="truncate font-medium text-xs">
              {modelList.find((m) => m.name === model)?.label || 'Select model'}
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-3.5 h-3.5 text-codinit-elements-textSecondary transition-transform duration-200',
                isModelDropdownOpen ? 'rotate-180' : undefined,
              )}
            />
          </div>
        </div>

        {isModelDropdownOpen && (
          <div
            className="absolute top-full z-[100] w-full mt-1 py-1.5 rounded-lg border border-codinit-elements-borderColor/50 bg-codinit-elements-background-depth-2 backdrop-blur-xl shadow-2xl shadow-black/20"
            role="listbox"
            id="model-listbox"
          >
            <div className="px-2 pb-1.5">
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="i-ph:magnifying-glass text-codinit-elements-textTertiary text-xs" />
                </div>
                <input
                  ref={modelSearchInputRef}
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={classNames(
                    'w-full pl-7 pr-2 py-1.5 rounded-md text-xs',
                    'bg-codinit-elements-background-depth-1/50 border border-codinit-elements-borderColor/40',
                    'text-codinit-elements-textPrimary placeholder:text-codinit-elements-textTertiary/60',
                    'focus:outline-none focus:ring-1 focus:ring-accent-500/30 focus:border-accent-500/50',
                    'transition-all duration-150',
                  )}
                  onClick={(e) => e.stopPropagation()}
                  role="searchbox"
                  aria-label="Search models"
                />
              </div>
            </div>

            <div
              className={classNames(
                'max-h-48 overflow-y-auto px-0.5',
                'sm:scrollbar-none',
                '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5',
                '[&::-webkit-scrollbar-thumb]:bg-codinit-elements-borderColor/50',
                '[&::-webkit-scrollbar-thumb]:hover:bg-codinit-elements-borderColor',
                '[&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-track]:rounded-full',
              )}
            >
              {modelLoading === 'all' || modelLoading === provider?.name ? (
                <div className="px-3 py-2 text-xs text-codinit-elements-textTertiary/70 text-center flex items-center justify-center gap-2">
                  <div className="i-svg-spinners:90-ring-with-bg text-accent-500 text-sm animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="px-3 py-2 text-xs text-codinit-elements-textTertiary/70 text-center">
                  No models found
                </div>
              ) : (
                filteredModels.map((modelOption, index) => (
                  <div
                    ref={(el) => (modelOptionsRef.current[index] = el)}
                    key={index}
                    role="option"
                    aria-selected={model === modelOption.name}
                    className={classNames(
                      'px-2.5 py-1.5 mx-1 mb-0.5 text-xs cursor-pointer rounded-md',
                      'transition-all duration-150 ease-in-out',
                      'outline-none',
                      model === modelOption.name
                        ? 'bg-accent-500/10 text-accent-500 font-medium'
                        : 'text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-3/50',
                      focusedModelIndex === index ? 'ring-1 ring-inset ring-accent-500/30' : undefined,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModel?.(modelOption.name);
                      setIsModelDropdownOpen(false);
                      setModelSearchQuery('');
                    }}
                    tabIndex={focusedModelIndex === index ? 0 : -1}
                  >
                    {modelOption.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
