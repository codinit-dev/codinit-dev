/// <reference types="vite/client" />
import { createRequestHandler } from '@remix-run/node';
import electron, { app, BrowserWindow, ipcMain, protocol, session } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import * as pkg from '../../package.json';
import { setupAutoUpdater } from './utils/auto-update';
import { isDev, DEFAULT_PORT } from './utils/constants';
import { initViteServer, viteServer } from './utils/vite-server';
import { setupMenu } from './ui/menu';
import { createWindow } from './ui/window';
import { initCookies } from './utils/cookie';
import { loadServerBuild, serveAsset } from './utils/serve';
import { reloadOnChange } from './utils/reload';

Object.assign(console, log.functions);

console.debug('main: import.meta.env:', import.meta.env);
console.log('main: isDev:', isDev);
console.log('NODE_ENV:', global.process.env.NODE_ENV);
console.log('isPackaged:', app.isPackaged);

// Log unhandled errors
process.on('uncaughtException', async (error) => {
  console.log('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (error) => {
  console.log('Unhandled Rejection:', error);
});

(() => {
  const root = global.process.env.APP_PATH_ROOT ?? import.meta.env.VITE_APP_PATH_ROOT;

  if (root === undefined) {
    console.log('no given APP_PATH_ROOT or VITE_APP_PATH_ROOT. default path is used.');
    return;
  }

  if (!path.isAbsolute(root)) {
    console.log('APP_PATH_ROOT must be absolute path.');
    global.process.exit(1);
  }

  console.log(`APP_PATH_ROOT: ${root}`);

  const subdirName = pkg.name;

  for (const [key, val] of [
    ['appData', ''],
    ['userData', subdirName],
    ['sessionData', subdirName],
  ] as const) {
    app.setPath(key, path.join(root, val));
  }

  app.setAppLogsPath(path.join(root, subdirName, 'Logs'));
})();

console.log('appPath:', app.getAppPath());

const keys: Parameters<typeof app.getPath>[number][] = ['home', 'appData', 'userData', 'sessionData', 'logs', 'temp'];
keys.forEach((key) => console.log(`${key}:`, app.getPath(key)));

// Performance optimizations
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');

// Limit process count to prevent resource exhaustion
if (process.platform !== 'darwin') {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
}

console.log('start whenReady');

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  var __electron__: typeof electron;
}

(async () => {
  await app.whenReady();
  console.log('App is ready');

  // Load any existing cookies from ElectronStore, set as cookie
  await initCookies();

  const serverBuild = await loadServerBuild();

  // Cache the request handler instead of creating on every request
  const handler = createRequestHandler(serverBuild, 'production');
  const assetPath = path.join(app.getAppPath(), 'build', 'client');

  protocol.handle('http', async (req) => {
    if (isDev) {
      return await fetch(req);
    }

    req.headers.append('Referer', req.referrer);

    try {
      const url = new URL(req.url);

      // Forward requests to specific local server ports
      if (url.port !== `${DEFAULT_PORT}`) {
        return await fetch(req);
      }

      // Always try to serve asset first
      const res = await serveAsset(req, assetPath);

      if (res) {
        return res;
      }

      // Forward all cookies to remix server - optimized to only fetch when needed
      const cookies = await session.defaultSession.cookies.get({});

      if (cookies.length > 0) {
        req.headers.set('Cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));
      }

      // Use cached request handler
      const result = await handler(req, {
        /*
         * Remix app access cloudflare.env
         * Need to pass an empty object to prevent undefined
         */
        // @ts-ignore:next-line
        cloudflare: {},
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error handling request:', req.url, error.message);

      return new Response(`Error handling request to ${req.url}: ${error.stack ?? error.message}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }
  });

  const rendererURL = await (isDev
    ? (async () => {
        await initViteServer();

        if (!viteServer) {
          throw new Error('Vite server is not initialized');
        }

        const listen = await viteServer.listen();
        global.__electron__ = electron;
        viteServer.printUrls();

        return `http://localhost:${listen.config.server.port}`;
      })()
    : `http://localhost:${DEFAULT_PORT}`);

  console.log('Using renderer URL:', rendererURL);

  const win = createWindow(rendererURL);

  // Register window control IPC handlers immediately after window creation
  ipcMain.handle('window-minimize', () => {
    win.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    win.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    return win.isMaximized();
  });

  ipcMain.handle('window-get-platform', () => {
    return process.platform;
  });

  // Window state change listeners
  win.on('maximize', () => {
    win.webContents.send('window-maximized');
  });

  win.on('unmaximize', () => {
    win.webContents.send('window-unmaximized');
  });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(rendererURL);
    }
  });

  console.log('end whenReady');

  return win;
})()
  .then((win) => {
    // IPC test handler (ping removed to reduce overhead)
    ipcMain.handle('ipcTest', (event, ...args) => console.log('ipc: renderer -> main', { event, ...args }));

    // Cookie synchronization handlers
    ipcMain.handle('cookie-set', async (_, name: string, value: string, options?: any) => {
      const cookieDetails: Electron.CookiesSetDetails = {
        name,
        value,
        path: options?.path || '/',
        domain: options?.domain,
        secure: options?.secure || false,
        httpOnly: options?.httpOnly || false,
        expirationDate: options?.expires ? Math.floor(new Date(options.expires).getTime() / 1000) : undefined,
        url: `http://localhost:${DEFAULT_PORT}`,
        sameSite: 'lax',
      };

      try {
        await session.defaultSession.cookies.set(cookieDetails);
        return true;
      } catch (error) {
        console.error('Failed to set cookie in Electron session:', error);
        return false;
      }
    });

    ipcMain.handle('cookie-get', async (_, name: string) => {
      try {
        const cookies = await session.defaultSession.cookies.get({ name, url: `http://localhost:${DEFAULT_PORT}` });
        return cookies.length > 0 ? cookies[0].value : null;
      } catch (error) {
        console.error('Failed to get cookie from Electron session:', error);
        return null;
      }
    });

    ipcMain.handle('cookie-get-all', async (_) => {
      try {
        const cookies = await session.defaultSession.cookies.get({});
        return cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          path: cookie.path,
          domain: cookie.domain,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: cookie.expirationDate,
        }));
      } catch (error) {
        console.error('Failed to get all cookies from Electron session:', error);
        return [];
      }
    });

    ipcMain.handle('cookie-remove', async (_, name: string) => {
      try {
        await session.defaultSession.cookies.remove(`http://localhost:${DEFAULT_PORT}`, name);
        return true;
      } catch (error) {
        console.error('Failed to remove cookie from Electron session:', error);
        return false;
      }
    });

    return win;
  })
  .then((win) => {
    // Sync Electron session cookies to renderer document.cookie
    syncCookiesToRenderer(win);
    return setupMenu(win);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

reloadOnChange();
setupAutoUpdater();

// Function to sync Electron session cookies to renderer document.cookie (throttled)
let lastCookieSync = 0;
const COOKIE_SYNC_THROTTLE = 5000; // Only sync every 5 seconds

async function syncCookiesToRenderer(win: BrowserWindow) {
  const now = Date.now();

  if (now - lastCookieSync < COOKIE_SYNC_THROTTLE) {
    return;
  }

  lastCookieSync = now;

  try {
    const cookies = await session.defaultSession.cookies.get({});

    // Send cookies to renderer to sync with document.cookie
    win.webContents.send(
      'sync-cookies',
      cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate,
      })),
    );

    if (isDev) {
      console.log(`Synced ${cookies.length} cookies to renderer`);
    }
  } catch (error) {
    console.error('Failed to sync cookies to renderer:', error);
  }
}
