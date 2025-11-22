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
import { initCookies, storeCookies } from './utils/cookie';
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

  protocol.handle('http', async (req) => {
    console.log('Handling request for:', req.url);

    if (isDev) {
      console.log('Dev mode: forwarding to vite server');
      return await fetch(req);
    }

    req.headers.append('Referer', req.referrer);

    try {
      const url = new URL(req.url);

      // Forward requests to specific local server ports
      if (url.port !== `${DEFAULT_PORT}`) {
        console.log('Forwarding request to local server:', req.url);
        return await fetch(req);
      }

      // Always try to serve asset first
      const assetPath = path.join(app.getAppPath(), 'build', 'client');
      const res = await serveAsset(req, assetPath);

      if (res) {
        console.log('Served asset:', req.url);
        return res;
      }

      // Forward all cookies to remix server
      const cookies = await session.defaultSession.cookies.get({});

      if (cookies.length > 0) {
        req.headers.set('Cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));

        // Store all cookies
        await storeCookies(cookies);
      }

      // Create request handler with the server build
      const handler = createRequestHandler(serverBuild, 'production');
      console.log('Handling request with server build:', req.url);

      const result = await handler(req, {
        /*
         * Remix app access cloudflare.env
         * In Electron, pass process.env so providers can access environment variables
         */
        // @ts-ignore:next-line
        cloudflare: {
          env: process.env as Record<string, string>,
        },
      });

      return result;
    } catch (err) {
      console.log('Error handling request:', {
        url: req.url,
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
                cause: err.cause,
              }
            : err,
      });

      const error = err instanceof Error ? err : new Error(String(err));

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

  const win = await createWindow(rendererURL);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(rendererURL);
    }
  });

  console.log('end whenReady');

  return win;
})()
  .then((win) => {
    // IPC samples : send and recieve.
    let count = 0;
    setInterval(() => win.webContents.send('ping', `hello from main! ${count++}`), 60 * 1000);
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
        console.log('Cookie set in Electron session:', name);

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
        console.log('Cookie removed from Electron session:', name);

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

// Function to sync Electron session cookies to renderer document.cookie
async function syncCookiesToRenderer(win: BrowserWindow) {
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

    console.log(`Synced ${cookies.length} cookies to renderer`);
  } catch (error) {
    console.error('Failed to sync cookies to renderer:', error);
  }
}
