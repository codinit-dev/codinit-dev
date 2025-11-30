import { useEffect, useState } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getPlatform: () => Promise<string>;
      onMaximize: (callback: () => void) => () => void;
      onUnmaximize: (callback: () => void) => () => void;
      offMaximize: (callback: () => void) => void;
      offUnmaximize: (callback: () => void) => void;
    };
  }
}

export function ElectronTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'linux'>('darwin');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getPlatform().then((plat: string) => {
        setPlatform(plat as 'win32' | 'darwin' | 'linux');
      });

      const handleMaximize = () => setIsMaximized(true);
      const handleUnmaximize = () => setIsMaximized(false);

      const cleanupMaximize = window.electronAPI.onMaximize(handleMaximize);
      const cleanupUnmaximize = window.electronAPI.onUnmaximize(handleUnmaximize);

      window.electronAPI.isMaximized().then(setIsMaximized);

      return () => {
        cleanupMaximize();
        cleanupUnmaximize();
      };
    }

    return undefined;
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  if (typeof window === 'undefined' || !window.electronAPI) {
    return null;
  }

  const isMacOS = platform === 'darwin';

  return (
    <div
      className="flex items-center h-9 bg-codinit-elements-background-depth-1 border-b border-codinit-elements-borderColor select-none"
      style={
        {
          WebkitAppRegion: 'drag',
          appRegion: 'drag',
        } as React.CSSProperties
      }
    >
      {/* macOS: Controls on left */}
      {isMacOS && (
        <div className="flex items-center pl-3 pr-2 space-x-2">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff3b30] transition-colors flex items-center justify-center group"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Close"
          >
            <div className="hidden group-hover:block text-[10px] text-[#6e0d03] font-bold leading-none">×</div>
          </button>
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffaa00] transition-colors flex items-center justify-center group"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Minimize"
          >
            <div className="hidden group-hover:block w-1.5 h-0.5 bg-[#6e4d00]" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-[#28c940] hover:bg-[#00d700] transition-colors flex items-center justify-center group"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <div className="hidden group-hover:block text-[8px] text-[#005700] font-bold leading-none">
              {isMaximized ? '−' : '+'}
            </div>
          </button>
        </div>
      )}

      {/* App branding - centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-codinit-elements-textSecondary">
          <img src="/icon-dark.png" alt="CodinIT" className="w-4 h-4 dark:hidden" />
          <img src="/icon-light.png" alt="CodinIT" className="w-4 h-4 hidden dark:block" />
          <span className="font-medium">CodinIT.dev</span>
        </div>
      </div>

      {/* Windows/Linux: Controls on right */}
      {!isMacOS && (
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            className="h-9 px-4 flex items-center justify-center hover:bg-codinit-elements-background-depth-2 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" className="fill-codinit-elements-textSecondary">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="h-9 px-4 flex items-center justify-center hover:bg-codinit-elements-background-depth-2 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className="fill-none stroke-codinit-elements-textSecondary"
              >
                <rect x="0" y="2" width="8" height="8" strokeWidth="1" />
                <rect x="2" y="0" width="8" height="8" strokeWidth="1" fill="var(--background)" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" className="stroke-codinit-elements-textSecondary">
                <rect x="0" y="0" width="10" height="10" strokeWidth="1" fill="none" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="h-9 px-4 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="fill-none stroke-current">
              <path d="M0 0 L10 10 M10 0 L0 10" strokeWidth="1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
