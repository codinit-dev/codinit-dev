import { ipcRenderer, contextBridge, type IpcRendererEvent } from 'electron';

console.debug('start preload.', ipcRenderer);

const ipc = {
  invoke(...args: any[]) {
    return ipcRenderer.invoke('ipcTest', ...args);
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(channel: string, func: Function) {
    const f = (event: IpcRendererEvent, ...args: any[]) => func(...[event, ...args]);
    console.debug('register listener', channel, f);
    ipcRenderer.on(channel, f);

    return () => {
      console.debug('remove listener', channel, f);
      ipcRenderer.removeListener(channel, f);
    };
  },
};

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

contextBridge.exposeInMainWorld('ipc', ipc);
contextBridge.exposeInMainWorld('electronCookies', cookies);
contextBridge.exposeInMainWorld('electronAPI', windowControls);
