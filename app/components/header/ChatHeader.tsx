import { useStore } from '@nanostores/react';
import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { ElectronWindowControls } from '~/components/ui/ElectronWindowControls';

export function ChatHeader() {
  const chat = useStore(chatStore);
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'linux' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getPlatform().then((plat: string) => {
        setPlatform(plat as 'win32' | 'darwin' | 'linux');
      });
    }
  }, []);

  if (!chat.started) {
    return null;
  }

  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const isMacOS = platform === 'darwin';

  return (
    <header
      className={classNames('flex shrink-0 select-none items-center pl-2 pr-3 h-12 bg-transparent relative')}
      style={
        isElectron
          ? ({
              WebkitAppRegion: 'drag',
              appRegion: 'drag',
            } as React.CSSProperties)
          : undefined
      }
    >
      {isElectron && isMacOS && (
        <ClientOnly>
          {() => (
            <div className="absolute left-2 top-0 h-12 flex items-center">
              <ElectronWindowControls />
            </div>
          )}
        </ClientOnly>
      )}
      <div className={classNames('flex items-center flex-1 min-w-0', isElectron && isMacOS ? 'ml-[72px]' : '')}>
        <a href="/" style={isElectron ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) : undefined}>
          <button
            className="flex items-center justify-center font-medium shrink-0 min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:op-50 relative disabled:cursor-not-allowed gap-1 h-9 focus-visible:outline-codinit-ds-brandHighlight bg-transparent [&:hover:where(:not(:disabled))]:bg-codinit-ds-inverseSurface/7 text-codinit-ds-textPrimary text-sm px-2"
            type="button"
          >
            <img src="/icon-dark.png" alt="app icon" className="w-6 h-6 inline-block dark:hidden" />
            <img src="/icon-light.png" alt="app icon" className="w-6 h-6 hidden dark:block" />
          </button>
        </a>
        <span className="text-codinit-elements-textPrimary opacity-[.12] text-xl antialiased mx-1">/</span>
        <div className="flex-1 px-4 truncate text-center text-codinit-elements-textPrimary min-w-0">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </div>
      </div>
      {isElectron && !isMacOS && (
        <ClientOnly>
          {() => (
            <div className="absolute right-0 top-0 h-12 flex items-center">
              <ElectronWindowControls />
            </div>
          )}
        </ClientOnly>
      )}
    </header>
  );
}
