export function initCookieBridge() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const authDomains = ['codinit.dev', '.codinit.dev', 'localhost'];

    console.log('Electron cookie bridge initialized for custom auth domain');

    if ((window as any).electronAPI.on) {
      (window as any).electronAPI.on('sync-cookies', (cookies: any[]) => {
        cookies.forEach((cookie) => {
          if (authDomains.some((domain) => cookie.domain?.includes(domain))) {
            document.cookie = `${cookie.name}=${cookie.value}; path=${cookie.path}; domain=${cookie.domain}; ${cookie.secure ? 'secure' : ''}; ${cookie.httpOnly ? 'httponly' : ''}`;
          }
        });
      });
    }
  }
}
