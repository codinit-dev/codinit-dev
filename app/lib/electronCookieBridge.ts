/*
 * Cookie bridge for Electron to synchronize js-cookie with Electron session cookies
 * This ensures that cookies set via js-cookie are also available to the protocol handler
 */

declare global {
  interface Window {
    electronCookies: {
      set: (name: string, value: string, options?: any) => Promise<boolean>;
      get: (name: string) => Promise<string | null>;
      getAll: () => Promise<
        Array<{
          name: string;
          value: string;
          path?: string;
          domain?: string;
          secure?: boolean;
          httpOnly?: boolean;
          expirationDate?: number;
        }>
      >;
      remove: (name: string) => Promise<boolean>;
    };
    ipc: {
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}

export function initCookieBridge() {
  // Only run in Electron environment
  if (typeof window === 'undefined' || !window.electronCookies) {
    return;
  }

  console.log('Initializing Electron cookie bridge');

  // Listen for cookie sync events from main process
  if (window.ipc) {
    window.ipc.on(
      'sync-cookies',
      (
        cookies: Array<{
          name: string;
          value: string;
          path?: string;
          domain?: string;
          secure?: boolean;
          httpOnly?: boolean;
          expirationDate?: number;
        }>,
      ) => {
        syncCookiesToDocument(cookies);
      },
    );
  }

  // Sync Electron session cookies to document.cookie on startup
  syncElectronCookiesToDocument();

  // Monkey patch document.cookie to sync with Electron session
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

  if (originalCookieDescriptor) {
    Object.defineProperty(document, 'cookie', {
      get: originalCookieDescriptor.get,
      set(value: string) {
        // Call original setter
        if (originalCookieDescriptor.set) {
          originalCookieDescriptor.set.call(this, value);
        }

        // Parse and sync to Electron session
        const cookieParts = value.split(';')[0].split('=');

        if (cookieParts.length >= 2) {
          const name = cookieParts[0].trim();
          const cookieValue = cookieParts[1];

          // Parse options from the full cookie string
          const options: any = {};
          const parts = value.split(';').slice(1);

          for (const part of parts) {
            const [key, val] = part.trim().split('=');

            switch (key.toLowerCase()) {
              case 'path':
                options.path = val;
                break;
              case 'domain':
                options.domain = val;
                break;
              case 'max-age':
                options.expires = new Date(Date.now() + parseInt(val) * 1000);
                break;
              case 'expires':
                options.expires = new Date(val);
                break;
              case 'secure':
                options.secure = true;
                break;
              case 'httponly':
                options.httpOnly = true;
                break;
              case 'samesite':
                options.sameSite = val;
                break;
            }
          }

          // Sync to Electron session (async, don't wait)
          window.electronCookies.set(name, cookieValue, options).catch((err) => {
            console.error('Failed to sync cookie to Electron session:', err);
          });
        }
      },
      configurable: true,
    });
  }
}

async function syncElectronCookiesToDocument() {
  try {
    const electronCookies = await window.electronCookies.getAll();

    for (const cookie of electronCookies) {
      // Only sync cookies that aren't already in document.cookie
      const existingCookies = document.cookie.split(';').map((c) => c.trim());
      const cookieExists = existingCookies.some((c) => c.startsWith(`${cookie.name}=`));

      if (!cookieExists) {
        let cookieString = `${cookie.name}=${cookie.value}`;

        if (cookie.path) {
          cookieString += `; path=${cookie.path}`;
        }

        if (cookie.domain) {
          cookieString += `; domain=${cookie.domain}`;
        }

        if (cookie.secure) {
          cookieString += '; secure';
        }

        if (cookie.httpOnly) {
          cookieString += '; httpOnly';
        }

        if (cookie.expirationDate) {
          const expires = new Date(cookie.expirationDate * 1000);
          cookieString += `; expires=${expires.toUTCString()}`;
        }

        document.cookie = cookieString;
        console.log('Synced Electron cookie to document.cookie:', cookie.name);
      }
    }
  } catch (error) {
    console.error('Failed to sync Electron cookies to document:', error);
  }
}

function syncCookiesToDocument(
  cookies: Array<{
    name: string;
    value: string;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    expirationDate?: number;
  }>,
) {
  for (const cookie of cookies) {
    // Only sync cookies that aren't already in document.cookie
    const existingCookies = document.cookie.split(';').map((c) => c.trim());
    const cookieExists = existingCookies.some((c) => c.startsWith(`${cookie.name}=`));

    if (!cookieExists) {
      let cookieString = `${cookie.name}=${cookie.value}`;

      if (cookie.path) {
        cookieString += `; path=${cookie.path}`;
      }

      if (cookie.domain) {
        cookieString += `; domain=${cookie.domain}`;
      }

      if (cookie.secure) {
        cookieString += '; secure';
      }

      if (cookie.httpOnly) {
        cookieString += '; httpOnly';
      }

      if (cookie.expirationDate) {
        const expires = new Date(cookie.expirationDate * 1000);
        cookieString += `; expires=${expires.toUTCString()}`;
      }

      document.cookie = cookieString;
      console.log('Synced Electron cookie to document.cookie:', cookie.name);
    }
  }
}
