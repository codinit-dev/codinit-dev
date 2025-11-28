import { useEffect, useState } from 'react';
import { classNames } from '~/utils/classNames';

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

export function CustomTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'linux'>('darwin');

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Get platform info
      window.electronAPI.getPlatform().then((plat: string) => {
        setPlatform(plat as 'win32' | 'darwin' | 'linux');
      });

      // Listen for window state changes
      const handleMaximize = () => setIsMaximized(true);
      const handleUnmaximize = () => setIsMaximized(false);

      const cleanupMaximize = window.electronAPI.onMaximize(handleMaximize);
      const cleanupUnmaximize = window.electronAPI.onUnmaximize(handleUnmaximize);

      // Check initial state
      window.electronAPI.isMaximized().then(setIsMaximized);

      return () => {
        cleanupMaximize();
        cleanupUnmaximize();
      };
    }
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

  // Only show on Electron platforms
  if (typeof window === 'undefined' || !window.electronAPI) {
    return null;
  }

  return (
    <div
      className={classNames(
        'flex items-center justify-between h-10 bg-codinit-elements-background-depth-1 border-b border-codinit-elements-border',
        'select-none',
      )}
      style={
        {
          WebkitAppRegion: 'drag',
          appRegion: 'drag',
        } as React.CSSProperties
      }
    >
      {/* Left side - Window controls (macOS style) */}
      {platform === 'darwin' && (
        <div className="flex items-center pl-4 space-x-2 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Close"
          />
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Minimize"
          />
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Maximize"
          />
        </div>
      )}

      {/* Center - App title */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <div className="flex items-center gap-2 px-4">
          <img src="/icon-dark.png" alt="CodinIT" className="w-4 h-4 dark:hidden flex-shrink-0" />
          <img src="/icon-light.png" alt="CodinIT" className="w-4 h-4 hidden dark:block flex-shrink-0" />
          <span className="text-sm font-medium text-codinit-elements-textPrimary truncate">CodinIT.dev</span>
        </div>
      </div>

      {/* Right side - Window controls (Windows/Linux style) */}
      {platform !== 'darwin' && (
        <div className="flex items-center pr-2 space-x-0 flex-shrink-0">
          <button
            onClick={handleMinimize}
            className="w-12 h-10 flex items-center justify-center hover:bg-codinit-elements-background-depth-2 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Minimize"
          >
            <div className="w-3 h-0.5 bg-codinit-elements-textSecondary" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-12 h-10 flex items-center justify-center hover:bg-codinit-elements-background-depth-2 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <div className="w-3 h-3 border border-codinit-elements-textSecondary relative">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-textSecondary" />
              </div>
            ) : (
              <div className="w-3 h-3 border border-codinit-elements-textSecondary" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-12 h-10 flex items-center justify-center hover:bg-red-500 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Close"
          >
            <div className="w-3 h-0.5 bg-codinit-elements-textSecondary rotate-45 relative">
              <div className="w-3 h-0.5 bg-codinit-elements-textSecondary -rotate-45 absolute top-0" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
