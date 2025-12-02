import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { chatStore } from '~/lib/stores/chat';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { ControlPanelDialog } from '~/components/@settings';

export function Header() {
  const chat = useStore(chatStore);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (chat.started) {
    return null;
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  return (
    <>
      <header className="flex items-center justify-between p-3 h-12 flex-1 bg-codinit-elements-background-depth-1 border-b border-transparent">
        <div className="flex items-center gap-2 z-logo text-codinit-elements-textPrimary cursor-pointer">
          <div className="i-ph:sidebar-simple-duotone text-xl" />
          <a href="/" className="text-2xl font-semibold text-accent flex items-center">
            <img src="/logo-dark.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
            <img src="/logo-light.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('https://github.com/Gerome-Elassaad/codinit-app/issues/new/choose', '_blank')}
            className="flex items-center justify-center font-medium shrink-0 min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:op-50 relative disabled:cursor-not-allowed gap-1 h-9 focus-visible:outline-codinit-ds-brandHighlight bg-transparent [&:hover:where(:not(:disabled))]:bg-codinit-ds-inverseSurface/7 text-codinit-ds-textPrimary text-sm px-2"
            type="button"
            title="Report a bug"
          >
            <div className="i-lucide:bug text-lg" />
          </button>
          <SettingsButton onClick={handleSettingsClick} />
        </div>
      </header>

      <ControlPanelDialog isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
}
