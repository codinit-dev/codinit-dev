import { useStore } from '@nanostores/react';
import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ElectronWindowControls } from '~/components/ui/ElectronWindowControls';

export function Header() {
  const chat = useStore(chatStore);
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'linux' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getPlatform().then((plat: string) => {
        setPlatform(plat as 'win32' | 'darwin' | 'linux');
      });
    }
  }, []);

  if (chat.started) {
    return null;
  }

  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const isMacOS = platform === 'darwin';

  return (
    <header
      className={classNames(
        'flex items-center p-3 h-12 flex-1 bg-codinit-elements-background-depth-1 border-b border-transparent relative',
      )}
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
            <div className="absolute left-3 top-0 h-12 flex items-center">
              <ElectronWindowControls />
            </div>
          )}
        </ClientOnly>
      )}
      <div
        className={classNames(
          'flex items-center gap-2 z-logo text-codinit-elements-textPrimary cursor-pointer',
          isElectron && isMacOS ? 'ml-20' : '',
        )}
      >
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a
          href="/"
          className="text-2xl font-semibold text-accent flex items-center"
          style={isElectron ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) : undefined}
        >
          <img src="/logo-dark.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-light.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
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
