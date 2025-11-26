const isElectron = typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Electron');

export class DatabaseService {
  private _ipcRenderer: any = null;
  private _initPromise: Promise<void> | null = null;

  private async _ensureIpcRenderer() {
    if (this._ipcRenderer) {
      return this._ipcRenderer;
    }

    if (!isElectron) {
      return null;
    }

    if (!this._initPromise) {
      this._initPromise = (async () => {
        try {
          const electron = await import('electron');
          this._ipcRenderer = electron.ipcRenderer;
        } catch (error) {
          console.warn('Failed to load electron module:', error);
        }
      })();
    }

    await this._initPromise;

    return this._ipcRenderer;
  }

  async registerUser(userData: {
    id: string;
    fullName: string;
    email: string;
    appVersion: string;
    platform: string;
    emailOptIn: boolean;
  }) {
    const ipc = await this._ensureIpcRenderer();

    if (!ipc) {
      console.warn('DatabaseService: Not running in Electron environment');

      return null;
    }

    return ipc.invoke('database:register-user', userData);
  }

  async getUser(userId: string) {
    const ipc = await this._ensureIpcRenderer();

    if (!ipc) {
      console.warn('DatabaseService: Not running in Electron environment');

      return null;
    }

    return ipc.invoke('database:get-user', userId);
  }

  async updateLastLogin(userId: string) {
    const ipc = await this._ensureIpcRenderer();

    if (!ipc) {
      console.warn('DatabaseService: Not running in Electron environment');

      return null;
    }

    return ipc.invoke('database:update-last-login', userId);
  }
}

export const databaseService = new DatabaseService();
