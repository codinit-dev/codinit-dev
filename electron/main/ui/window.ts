import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { store } from '../utils/store';

export function createWindow(rendererURL: string) {
  console.log('Creating window with URL:', rendererURL);

  const bounds = store.get('bounds');
  console.log('restored bounds:', bounds);

  const win = new BrowserWindow({
    ...{
      width: 1200,
      height: 800,
      ...bounds,
    },
    frame: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'build', 'electron', 'preload', 'index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      offscreen: false,
    },
  });

  console.log('Window created, loading URL...');
  win.loadURL(rendererURL).catch((err) => {
    console.log('Failed to load URL:', err);
  });

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  win.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  // Open devtools in development
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Debounce window bounds saving to prevent excessive disk writes
  let boundsTimeout: NodeJS.Timeout | null = null;
  const boundsListener = () => {
    if (boundsTimeout) {
      clearTimeout(boundsTimeout);
    }
    boundsTimeout = setTimeout(() => {
      const bounds = win.getBounds();
      store.set('bounds', bounds);
      boundsTimeout = null;
    }, 500);
  };
  win.on('moved', boundsListener);
  win.on('resized', boundsListener);

  return win;
}
