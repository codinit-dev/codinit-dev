import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function ChatHeader() {
  const chat = useStore(chatStore);

  if (!chat.started) {
    return null;
  }

  return (
    <header className="flex shrink-0 select-none items-center pl-2 pr-3 h-12 bg-transparent z-50 relative">
      <a href="/">
        <button
          className="flex items-center justify-center font-medium shrink-0 min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:op-50 relative disabled:cursor-not-allowed gap-1 h-9 focus-visible:outline-codinit-ds-brandHighlight bg-transparent [&:hover:where(:not(:disabled))]:bg-codinit-ds-inverseSurface/7 text-codinit-ds-textPrimary text-sm px-2"
          type="button"
        >
          <img src="/icon-dark.png" alt="app icon" className="w-6 h-6 inline-block dark:hidden" />
          <img src="/icon-light.png" alt="app icon" className="w-6 h-6 hidden dark:block" />
        </button>
      </a>
      <span className="text-codinit-elements-textPrimary opacity-[.12] text-xl antialiased mx-1">/</span>
      <div className="flex-1 pl-2 pr-4 truncate text-codinit-elements-textPrimary">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </div>
      <button
        onClick={() => window.open('https://github.com/codinit-dev/codinit-dev/issues/new/choose', '_blank')}
        className="flex items-center justify-center font-medium shrink-0 min-w-0 max-w-full rounded-md focus-visible:outline-2 relative gap-1 h-9 focus-visible:outline-codinit-ds-brandHighlight bg-transparent hover:bg-codinit-ds-inverseSurface/7 text-codinit-ds-textPrimary hover:text-codinit-ds-brandHighlight text-sm px-2 transition-colors"
        type="button"
        title="Report a bug"
      >
        <div className="i-lucide:bug text-lg" />
      </button>
    </header>
  );
}
