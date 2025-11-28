export function initCookieBridge() {
  /*
   * Electron cookie bridge initialization
   * This is a placeholder for Electron-specific cookie handling
   */
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    // Initialize cookie bridge for Electron
    console.log('Electron cookie bridge initialized');
  }
}
