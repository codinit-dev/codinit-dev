import { useEffect, useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import {
  TOKEN_PRESETS,
  selectedPresetStore,
  customConfigStore,
  updateSelectedPreset,
  updateCustomConfig,
  type TokenPreset,
  type TokenConfig,
} from '~/lib/stores/tokenConfig';

export const TokenConfigSelector = () => {
  const selectedPreset = useStore(selectedPresetStore);
  const customConfig = useStore(customConfigStore);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Local state for custom config editing
  const [editingConfig, setEditingConfig] = useState<TokenConfig>(customConfig);

  useEffect(() => {
    setEditingConfig(customConfig);
  }, [customConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1 >= TOKEN_PRESETS.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 < 0 ? TOKEN_PRESETS.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedIndex >= 0 && focusedIndex < TOKEN_PRESETS.length) {
          handlePresetSelect(TOKEN_PRESETS[focusedIndex]);
        }

        break;
      case 'Escape':
        e.preventDefault();

        setIsDropdownOpen(false);
        break;
    }
  };

  const handlePresetSelect = (preset: TokenPreset) => {
    updateSelectedPreset(preset.id);

    if (preset.id === 'custom') {
      setIsCustomModalOpen(true);
    }

    setIsDropdownOpen(false);
  };

  const handleCustomSave = () => {
    updateCustomConfig(editingConfig);
    setIsCustomModalOpen(false);
  };

  const currentPreset = TOKEN_PRESETS.find((p) => p.id === selectedPreset);

  return (
    <>
      <div className="relative z-50" onKeyDown={handleKeyDown} ref={dropdownRef}>
        <button
          className={classNames(
            'p-2 rounded-lg cursor-pointer transition-all duration-150',
            'hover:bg-codinit-elements-item-backgroundAccent/50',
            isDropdownOpen ? 'bg-codinit-elements-item-backgroundAccent/50' : '',
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title={`Token Config: ${currentPreset?.name || 'Default'}`}
          aria-expanded={isDropdownOpen}
          aria-controls="token-config-listbox"
          aria-haspopup="listbox"
        >
          <div className="i-ph:sliders text-lg" />
        </button>

        {isDropdownOpen && (
          <div
            className="absolute top-full mt-2 right-0 w-[280px] py-1.5 rounded-lg border border-codinit-elements-borderColor/50 bg-codinit-elements-background-depth-2 backdrop-blur-xl shadow-2xl shadow-black/20"
            role="listbox"
            id="token-config-listbox"
          >
            <div
              className={classNames(
                'max-h-64 overflow-y-auto px-0.5',
                'sm:scrollbar-none',
                '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5',
                '[&::-webkit-scrollbar-thumb]:bg-codinit-elements-borderColor/50',
                '[&::-webkit-scrollbar-thumb]:hover:bg-codinit-elements-borderColor',
                '[&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-track]:rounded-full',
              )}
            >
              {TOKEN_PRESETS.map((preset, index) => (
                <div
                  ref={(el) => (optionsRef.current[index] = el)}
                  key={preset.id}
                  role="option"
                  aria-selected={selectedPreset === preset.id}
                  className={classNames(
                    'px-2.5 py-2 mx-1 mb-0.5 cursor-pointer rounded-md',
                    'transition-all duration-150 ease-in-out',
                    'outline-none',
                    selectedPreset === preset.id
                      ? 'bg-accent-500/10 text-accent-500 font-medium'
                      : 'text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-3/50',
                    focusedIndex === index ? 'ring-1 ring-inset ring-accent-500/30' : undefined,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePresetSelect(preset);
                  }}
                  tabIndex={focusedIndex === index ? 0 : -1}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-xs font-medium">{preset.name}</div>
                      <div className="text-[10px] text-codinit-elements-textTertiary mt-0.5">{preset.description}</div>
                    </div>
                    {selectedPreset === preset.id && (
                      <div className="i-ph:check w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Config Modal */}
      {isCustomModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsCustomModalOpen(false)}
        >
          <div
            className="bg-codinit-elements-background-depth-2 rounded-xl border border-codinit-elements-borderColor shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-codinit-elements-textPrimary">Custom Token Configuration</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
              >
                <div className="i-ph:x w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Output Tokens */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                  Output Tokens
                </label>
                <input
                  type="number"
                  value={editingConfig.maxTokens || ''}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      maxTokens: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Auto"
                  className="w-full px-3 py-2 rounded-lg bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor text-codinit-elements-textPrimary text-sm focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500/50 outline-none transition-all"
                />
                <p className="text-xs text-codinit-elements-textTertiary mt-1">
                  Maximum number of tokens to generate (leave empty for auto)
                </p>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                  Temperature
                  <span className="text-codinit-elements-textTertiary font-normal ml-2">
                    {editingConfig.temperature?.toFixed(2) || '0.00'}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={editingConfig.temperature || 0}
                  onChange={(e) => setEditingConfig({ ...editingConfig, temperature: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-codinit-elements-textTertiary mt-1">Controls randomness (0.0 - 2.0)</p>
              </div>

              {/* Top P */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                  Top P
                  <span className="text-codinit-elements-textTertiary font-normal ml-2">
                    {editingConfig.topP?.toFixed(2) || '0.00'}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editingConfig.topP || 0}
                  onChange={(e) => setEditingConfig({ ...editingConfig, topP: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-codinit-elements-textTertiary mt-1">Nucleus sampling (0.0 - 1.0)</p>
              </div>

              {/* Top K */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">Top K</label>
                <input
                  type="number"
                  value={editingConfig.topK || ''}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      topK: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Auto"
                  className="w-full px-3 py-2 rounded-lg bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor text-codinit-elements-textPrimary text-sm focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500/50 outline-none transition-all"
                />
                <p className="text-xs text-codinit-elements-textTertiary mt-1">Top-k sampling</p>
              </div>

              {/* Frequency Penalty */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                  Frequency Penalty
                  <span className="text-codinit-elements-textTertiary font-normal ml-2">
                    {editingConfig.frequencyPenalty?.toFixed(2) || '0.00'}
                  </span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.01"
                  value={editingConfig.frequencyPenalty || 0}
                  onChange={(e) => setEditingConfig({ ...editingConfig, frequencyPenalty: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-codinit-elements-textTertiary mt-1">Penalize repeated tokens (-2.0 - 2.0)</p>
              </div>

              {/* Presence Penalty */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                  Presence Penalty
                  <span className="text-codinit-elements-textTertiary font-normal ml-2">
                    {editingConfig.presencePenalty?.toFixed(2) || '0.00'}
                  </span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.01"
                  value={editingConfig.presencePenalty || 0}
                  onChange={(e) => setEditingConfig({ ...editingConfig, presencePenalty: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-codinit-elements-textTertiary mt-1">Encourage new topics (-2.0 - 2.0)</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCustomSave}
                className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="flex-1 px-4 py-2 bg-codinit-elements-background-depth-3 hover:bg-codinit-elements-background-depth-4 text-codinit-elements-textPrimary rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
