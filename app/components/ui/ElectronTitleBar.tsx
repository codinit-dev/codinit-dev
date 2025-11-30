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
      className="flex items-center justify-between h-8 bg-codinit-elements-background-depth-2 border-b border-codinit-elements-borderColor/50 select-none shadow-sm"
      style={
        {
          WebkitAppRegion: 'drag',
          appRegion: 'drag',
        } as React.CSSProperties
      }
    >
      {/* macOS: Controls on left */}
      {isMacOS ? (
        <div className="flex items-center pl-2.5 space-x-2">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-all flex items-center justify-center group shadow-sm"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Close"
          >
            <div className="opacity-0 group-hover:opacity-100 text-[9px] text-[#4d0000] font-bold leading-none transition-opacity">
              ×
            </div>
          </button>
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#ffaa00] transition-all flex items-center justify-center group shadow-sm"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Minimize"
          >
            <div className="opacity-0 group-hover:opacity-100 w-1.5 h-[1.5px] bg-[#6e4d00] transition-opacity" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#00d700] transition-all flex items-center justify-center group shadow-sm"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <div className="opacity-0 group-hover:opacity-100 text-[7px] text-[#004d00] font-bold leading-none transition-opacity">
              {isMaximized ? '□' : '+'}
            </div>
          </button>
        </div>
      ) : (
        <div className="w-12" />
      )}

      {/* App branding - centered */}
      <div className="flex items-center gap-2 text-xs text-codinit-elements-textSecondary font-medium">
        <img src="/icon-dark.png" alt="CodinIT" className="w-3.5 h-3.5 dark:hidden" />
        <img src="/icon-light.png" alt="CodinIT" className="w-3.5 h-3.5 hidden dark:block" />
        <span className="tracking-wide">CodinIT.dev</span>
      </div>

      {/* Windows/Linux: Controls on right */}
      {!isMacOS ? (
        <div className="flex items-center h-full">
          <button
            onClick={handleMinimize}
            className="h-full px-4 flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Minimize"
          >
            <svg width="12" height="1" viewBox="0 0 12 1" className="fill-codinit-elements-textSecondary">
              <rect width="12" height="1" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="h-full px-4 flex items-center justify-center hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                className="fill-none stroke-codinit-elements-textSecondary"
              >
                <rect x="0" y="2.5" width="8" height="8" strokeWidth="1" />
                <rect x="2.5" y="0" width="8" height="8" strokeWidth="1" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11" className="stroke-codinit-elements-textSecondary">
                <rect x="0.5" y="0.5" width="10" height="10" strokeWidth="1" fill="none" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="h-full px-4 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Close"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" className="fill-none stroke-current" strokeWidth="1">
              <path d="M0.5 0.5 L10.5 10.5 M10.5 0.5 L0.5 10.5" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="w-12" />
      )}
    </div>
  );
}
