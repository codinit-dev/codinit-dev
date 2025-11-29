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

interface ElectronWindowControlsProps {
  className?: string;
}

export function ElectronWindowControls({ className }: ElectronWindowControlsProps) {
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

  if (platform === 'darwin') {
    return (
      <div className={classNames('flex items-center space-x-2 flex-shrink-0', className)}>
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
    );
  }

  return (
    <div className={classNames('flex items-center space-x-0 flex-shrink-0', className)}>
      <button
        onClick={handleMinimize}
        className="w-12 h-12 flex items-center justify-center hover:bg-codinit-elements-background-depth-2 transition-colors"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="Minimize"
      >
        <div className="w-3 h-0.5 bg-codinit-elements-textSecondary" />
      </button>
      <button
        onClick={handleMaximize}
        className="w-12 h-12 flex items-center justify-center hover:bg-codinit-elements-background-depth-2 transition-colors"
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
        className="w-12 h-12 flex items-center justify-center hover:bg-red-500 transition-colors"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="Close"
      >
        <div className="w-3 h-0.5 bg-codinit-elements-textSecondary rotate-45 relative">
          <div className="w-3 h-0.5 bg-codinit-elements-textSecondary -rotate-45 absolute top-0" />
        </div>
      </button>
    </div>
  );
}
