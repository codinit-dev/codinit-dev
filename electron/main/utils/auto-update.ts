import logger from 'electron-log';
import { app } from 'electron';
import type { AppUpdater, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater';
import path from 'node:path';

// NOTE: workaround to use electron-updater.
import * as electronUpdater from 'electron-updater';
import { isDev } from './constants';

const autoUpdater: AppUpdater = (electronUpdater as any).default.autoUpdater;

export async function setupAutoUpdater() {
  // Configure logger
  logger.transports.file.level = 'debug';
  autoUpdater.logger = logger;

  // Configure custom update config file
  let resourcePath: string;

  if (isDev) {
    resourcePath = path.join(process.cwd(), 'electron-update.yml');
  } else {
    // In packaged app, electron-update.yml is in the app's root directory
    resourcePath = path.join(app.getAppPath(), 'electron-update.yml');
  }

  logger.info('Update config path:', resourcePath);
  logger.info('App path:', app.getAppPath());
  logger.info('Is packaged:', app.isPackaged);

  try {
    autoUpdater.updateConfigPath = resourcePath;
    logger.info('Update config path set successfully');
  } catch (err) {
    logger.error('Failed to set update config path:', err);
  }

  // Disable auto download - we want to ask user first
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Helper to send events to all windows
  const sendToAllWindows = (channel: string, ...args: any[]) => {
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach((win: any) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    });
  };

  // IPC Listeners
  const { ipcMain } = require('electron');

  ipcMain.handle('update-check', async () => {
    logger.info('Manual update check requested via IPC');
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, result };
    } catch (error) {
      logger.error('Manual update check failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('update-download', async () => {
    logger.info('Download update requested via IPC');
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      logger.error('Download update failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('update-install', () => {
    logger.info('Install and restart requested via IPC');
    autoUpdater.quitAndInstall(false);
  });

  // AutoUpdater Events
  autoUpdater.on('checking-for-update', () => {
    logger.info('checking-for-update...');
    sendToAllWindows('auto-updater:checking-for-update');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    logger.info('Update available:', info);
    sendToAllWindows('auto-updater:update-available', info);
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    logger.info('Update not available.');
    sendToAllWindows('auto-updater:update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    logger.error('Error in auto-updater:', err);
    sendToAllWindows('auto-updater:error', err.message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    // logger.info('Download progress:', progressObj.percent); // Reduce log noise
    sendToAllWindows('auto-updater:download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
    logger.info('Update downloaded:', info);
    sendToAllWindows('auto-updater:update-downloaded', info);
  });

  // Initial check (optional, can be triggered by UI)
  // setTimeout(() => {
  //   autoUpdater.checkForUpdates().catch(err => logger.error('Initial check failed', err));
  // }, 5000);

  // Periodic checks can still be here, but we'll let the UI initiate them mostly so we have visibility
  // If we do want background checks:
  setInterval(
    async () => {
      try {
        logger.info('Performing periodic background update check...');
        await autoUpdater.checkForUpdates();
      } catch (err) {
        logger.error('Periodic background update check failed:', err);
      }
    },
    4 * 60 * 60 * 1000,
  );
}
