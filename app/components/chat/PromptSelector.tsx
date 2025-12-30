import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';
import { PromptRegistry } from '~/lib/common/prompt-registry';

interface PromptSelectorProps {
  promptId?: string;
  setPromptId?: (promptId: string) => void;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({ promptId, setPromptId }) => {
  const prompts = PromptRegistry.list();
  const currentPrompt = prompts.find((p) => p.id === promptId) || prompts.find((p) => p.id === 'default');

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={classNames(
            'flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200',
            'bg-codinit-elements-item-backgroundDefault text-codinit-elements-item-contentDefault',
            'hover:bg-codinit-elements-item-backgroundActive hover:text-codinit-elements-item-contentActive',
            'border border-codinit-elements-borderColor',
          )}
        >
          <div className="i-ph:terminal-window text-xs" />
          <span className="truncate max-w-[120px]">{currentPrompt?.label || 'Prompt'}</span>
          <div className="i-ph:caret-down text-[10px] opacity-50" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={classNames(
            'min-w-[200px] rounded-lg p-1',
            'bg-codinit-elements-background-depth-2 backdrop-blur-xl',
            'border border-codinit-elements-borderColor',
            'shadow-xl shadow-black/40',
            'animate-in fade-in zoom-in-95 duration-200',
            'z-[1000]',
          )}
          side="top"
          align="start"
          sideOffset={8}
        >
          <div className="px-2 py-1 mb-1 text-[9px] font-bold uppercase tracking-wider text-codinit-elements-textTertiary">
            Prompt Template
          </div>
          {prompts.map((prompt) => (
            <DropdownMenu.Item
              key={prompt.id}
              className={classNames(
                'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none transition-all duration-200',
                'hover:bg-codinit-elements-item-backgroundActive/80',
                promptId === prompt.id
                  ? 'bg-codinit-elements-item-backgroundAccent text-codinit-elements-textPrimary'
                  : 'text-codinit-elements-textSecondary',
              )}
              onSelect={() => setPromptId?.(prompt.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={classNames(
                    'w-6 h-6 rounded flex items-center justify-center border transition-colors',
                    promptId === prompt.id
                      ? 'bg-accent-500/20 border-accent-500/30 text-accent-500'
                      : 'bg-codinit-elements-bg-depth-3 border-codinit-elements-borderColor text-codinit-elements-textTertiary',
                  )}
                >
                  <div
                    className={classNames(
                      prompt.category === 'core'
                        ? 'i-ph:cpu'
                        : prompt.category === 'experimental'
                          ? 'i-ph:flask'
                          : 'i-ph:sparkle',
                      'text-sm',
                    )}
                  />
                </div>
                <div className="flex flex-col gap-0">
                  <span className="font-semibold text-[11px]">{prompt.label}</span>
                  {prompt.description && (
                    <span className="text-[9px] opacity-60 leading-none line-clamp-1">{prompt.description}</span>
                  )}
                </div>
              </div>
              {promptId === prompt.id && <div className="i-ph:check-circle-fill text-accent-500 text-sm" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
