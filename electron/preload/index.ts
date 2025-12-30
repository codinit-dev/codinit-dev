import { ipcRenderer, contextBridge } from 'electron';

const cookies = {
  set: (name: string, value: string, options?: any) => {
    return ipcRenderer.invoke('cookie-set', name, value, options);
  },
  get: (name: string) => {
    return ipcRenderer.invoke('cookie-get', name);
  },
  getAll: () => {
    return ipcRenderer.invoke('cookie-get-all');
  },
  remove: (name: string) => {
    return ipcRenderer.invoke('cookie-remove', name);
  },
};

const windowControls = {
  minimize: () => {
    ipcRenderer.invoke('window-minimize');
  },
  maximize: () => {
    ipcRenderer.invoke('window-maximize');
  },
  close: () => {
    ipcRenderer.invoke('window-close');
  },
  isMaximized: () => {
    return ipcRenderer.invoke('window-is-maximized');
  },
  getPlatform: () => {
    return ipcRenderer.invoke('window-get-platform');
  },
  saveFileLocal: (projectName: string, filePath: string, content: string | Uint8Array) => {
    return ipcRenderer.invoke('save-file-local', projectName, filePath, content);
  },
  initializeProject: (projectName: string) => {
    return ipcRenderer.invoke('initialize-project', projectName);
  },
  onMaximize: (callback: () => void) => {
    ipcRenderer.on('window-maximized', callback);
    return () => ipcRenderer.removeListener('window-maximized', callback);
  },
  onUnmaximize: (callback: () => void) => {
    ipcRenderer.on('window-unmaximized', callback);
    return () => ipcRenderer.removeListener('window-unmaximized', callback);
  },
  offMaximize: (callback: () => void) => {
    ipcRenderer.removeListener('window-maximized', callback);
  },
  offUnmaximize: (callback: () => void) => {
    ipcRenderer.removeListener('window-unmaximized', callback);
  },
};

const electronUpdates = {
  checkForUpdates: () => ipcRenderer.invoke('update-check'),
  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  quitAndInstall: () => ipcRenderer.invoke('update-install'),
  onCheckingForUpdate: (callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on('auto-updater:checking-for-update', subscription);
    return () => ipcRenderer.removeListener('auto-updater:checking-for-update', subscription);
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    const subscription = (_event: any, info: any) => callback(info);
    ipcRenderer.on('auto-updater:update-available', subscription);
    return () => ipcRenderer.removeListener('auto-updater:update-available', subscription);
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    const subscription = (_event: any, info: any) => callback(info);
    ipcRenderer.on('auto-updater:update-not-available', subscription);
    return () => ipcRenderer.removeListener('auto-updater:update-not-available', subscription);
  },
  onDownloadProgress: (callback: (progressObj: any) => void) => {
    const subscription = (_event: any, progressObj: any) => callback(progressObj);
    ipcRenderer.on('auto-updater:download-progress', subscription);
    return () => ipcRenderer.removeListener('auto-updater:download-progress', subscription);
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    const subscription = (_event: any, info: any) => callback(info);
    ipcRenderer.on('auto-updater:update-downloaded', subscription);
    return () => ipcRenderer.removeListener('auto-updater:update-downloaded', subscription);
  },
  onError: (callback: (error: string) => void) => {
    const subscription = (_event: any, error: string) => callback(error);
    ipcRenderer.on('auto-updater:error', subscription);
    return () => ipcRenderer.removeListener('auto-updater:error', subscription);
  },
};

contextBridge.exposeInMainWorld('electronCookies', cookies);
contextBridge.exposeInMainWorld('electronAPI', windowControls);
contextBridge.exposeInMainWorld('electronUpdates', electronUpdates);
