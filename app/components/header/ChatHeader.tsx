import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function ChatHeader() {
  const chat = useStore(chatStore);

  // Only show when chat has started
  if (!chat.started) {
    return null;
  }

  return (
    <header
      className={classNames(
        'flex shrink-0 select-none items-center pl-2 pr-3 h-12 max-w-[var(--chat-min-width)]',
        'bg-codinit-elements-background-depth-1 border-b border-codinit-elements-borderColor',
      )}
    >
      <a href="/">
        <button
          className="flex items-center justify-center font-medium shrink-0 min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:op-50 relative disabled:cursor-not-allowed gap-1 h-9 focus-visible:outline-bolt-ds-brandHighlight bg-transparent [&:hover:where(:not(:disabled))]:bg-bolt-ds-inverseSurface/7 text-bolt-ds-textPrimary text-sm px-2"
          type="button"
        >
          <img src="/icon.svg" alt="app icon" className="w-6 h-6" />
        </button>
      </a>
      <span className="text-bolt-elements-textPrimary opacity-[.12] text-xl antialiased mx-1">/</span>
      <button
        className="flex items-center justify-center font-medium shrink-0 min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:op-50 relative disabled:cursor-not-allowed gap-1 h-9 focus-visible:outline-bolt-ds-brandHighlight bg-transparent [&:hover:where(:not(:disabled))]:bg-bolt-ds-inverseSurface/7 text-bolt-ds-textPrimary text-sm px-2 -mr-px"
        type="button"
        id="radix-:r2i:"
        aria-haspopup="menu"
        aria-expanded="false"
        data-state="closed"
        aria-describedby="radix-:r2k:"
      >
        <span className="i-lucide:chevrons-up-down size-4 opacity-30 ml-1 -mr-1"></span>
      </button>
      <span className="text-bolt-elements-textPrimary opacity-[.12] text-xl antialiased mx-1">/</span>
      <div className="flex-1 px-4 truncate text-center text-codinit-elements-textPrimary">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </div>
    </header>
  );
}
