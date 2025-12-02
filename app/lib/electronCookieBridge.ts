export function initCookieBridge() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    console.log('Electron cookie bridge initialized');
  }
}
