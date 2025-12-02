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
        <div className="flex items-center">
          <SettingsButton onClick={handleSettingsClick} />
        </div>
      </header>

      <ControlPanelDialog isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
}
