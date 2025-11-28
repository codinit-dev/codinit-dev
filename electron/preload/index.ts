import { ipcRenderer, contextBridge, type IpcRendererEvent } from 'electron';

console.debug('start preload.', ipcRenderer);

const ipc = {
  invoke(...args: any[]) {
    return ipcRenderer.invoke('ipcTest', ...args);
  },
  on(channel: string, func: (...args: any[]) => void) {
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

contextBridge.exposeInMainWorld('ipc', ipc);
contextBridge.exposeInMainWorld('electronCookies', cookies);

// Expose electronAPI for cookie bridge
contextBridge.exposeInMainWorld('electronAPI', {
  on: ipc.on,
  invoke: ipc.invoke,
});
