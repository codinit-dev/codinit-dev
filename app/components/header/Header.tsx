import { useStore } from '@nanostores/react';
import { useUser } from '@clerk/remix';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';

export function Header() {
  const chat = useStore(chatStore);
  const { isSignedIn } = useUser();

  // Only show when chat has NOT started
  if (chat.started) {
    return null;
  }

  return (
    <header
      className={classNames(
        'flex items-center justify-between p-3 h-12 flex-1 bg-codinit-elements-background-depth-1 border-b border-transparent',
      )}
    >
      <div className="flex items-center gap-2 z-logo text-codinit-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <img src="/logo-dark.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-light.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
      </div>

      {!isSignedIn && (
        <button
          onClick={() => {
            const signUpUrl = 'https://smooth-crab-83.accounts.dev/sign-up?redirect_url=codinit-auth://signup-callback';

            if (typeof window !== 'undefined' && (window as any).electronAPI) {
              (window as any).electronAPI.invoke('open-external', signUpUrl);
            } else {
              window.open(signUpUrl, '_blank');
            }
          }}
          className="px-4 py-1.5 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          Join Waitlist
        </button>
      )}
    </header>
  );
}
