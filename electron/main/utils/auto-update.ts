import logger from 'electron-log';
import type { MessageBoxOptions } from 'electron';
import { app, dialog } from 'electron';
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

  autoUpdater.on('checking-for-update', () => {
    logger.info('checking-for-update...');
  });

  autoUpdater.on('update-available', async (info: UpdateInfo) => {
    logger.info('Update available.', info);

    const dialogOpts: MessageBoxOptions = {
      type: 'info' as const,
      buttons: ['Update', 'Later'],
      title: 'Application Update',
      message: `Version ${info.version} is available.`,
      detail: 'A new version is available. Would you like to update now?',
    };

    const response = await dialog.showMessageBox(dialogOpts);

    if (response.response === 0) {
      logger.info('User chose to update. Starting download...');
      autoUpdater.downloadUpdate();
    } else {
      logger.info('User chose to skip update');
    }
  });

  autoUpdater.on('update-not-available', () => {
    logger.info('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    logger.error('Error in auto-updater:', err);
    dialog.showErrorBox('Update Error', `Failed to check for updates: ${err.message}`);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    logger.info('Download progress:', progressObj);
  });

  autoUpdater.on('update-downloaded', async (event: UpdateDownloadedEvent) => {
    logger.info('Update downloaded:', formatUpdateDownloadedEvent(event));

    const dialogOpts: MessageBoxOptions = {
      type: 'info' as const,
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: 'Update Downloaded',
      detail: 'A new version has been downloaded. Restart the application to apply the updates.',
    };

    const response = await dialog.showMessageBox(dialogOpts);

    if (response.response === 0) {
      logger.info('User chose to restart and install update');
      autoUpdater.quitAndInstall(false);
    } else {
      logger.info('User chose to restart later');
    }
  });

  // Check for updates
  try {
    logger.info('Checking for updates. Current version:', app.getVersion());
    await autoUpdater.checkForUpdates();
    logger.info('Update check completed successfully');
  } catch (err) {
    logger.error('Failed to check for updates:', err);

    // Show user-friendly error message
    dialog.showErrorBox(
      'Update Check Failed',
      'Unable to check for updates. Please check your internet connection and try again later.',
    );
  }

  // Set up periodic update checks (every 4 hours)
  setInterval(
    async () => {
      try {
        logger.info('Performing periodic update check...');
        await autoUpdater.checkForUpdates();
        logger.info('Periodic update check completed');
      } catch (err) {
        logger.error('Periodic update check failed:', err);

        // Don't show dialog for periodic checks to avoid annoying users
      }
    },
    4 * 60 * 60 * 1000,
  );
}

function formatUpdateDownloadedEvent(event: UpdateDownloadedEvent): string {
  return JSON.stringify({
    version: event.version,
    downloadedFile: event.downloadedFile,
    files: event.files.map((e) => ({ files: { url: e.url, size: e.size } })),
  });
}
