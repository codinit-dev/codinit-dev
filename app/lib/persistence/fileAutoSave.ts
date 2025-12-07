import { createScopedLogger } from '~/utils/logger';
import type { FileMap } from '~/lib/stores/files';
import type { Snapshot } from './types';
import { db } from './useChatHistory';
import { setSnapshot, getSnapshot } from './db';
import { getCurrentChatId } from '~/utils/fileLocks';

const logger = createScopedLogger('FileAutoSave');

const AUTO_SAVE_INTERVAL = 30000;
const LOCALSTORAGE_KEY_PREFIX = 'codinit-autosave-files';
const LOCALSTORAGE_BACKUP_KEY = 'codinit-files-backup';
const MAX_STRINGIFY_SIZE = 5 * 1024 * 1024;

let autoSaveTimer: NodeJS.Timeout | null = null;
let lastSavedHash: string | null = null;

function getFileHash(files: FileMap): string {
  const keys = Object.keys(files);
  return `${keys.length}-${keys.join('|')}`;
}

export function saveFilesToLocalStorage(chatId: string, files: FileMap): void {
  try {
    const data = {
      chatId,
      files,
      timestamp: Date.now(),
    };

    const estimatedSize = JSON.stringify(data).length;

    if (estimatedSize > MAX_STRINGIFY_SIZE) {
      logger.warn(`Data size (${estimatedSize} bytes) exceeds maximum, skipping save`);
      return;
    }

    localStorage.setItem(`${LOCALSTORAGE_KEY_PREFIX}-${chatId}`, JSON.stringify(data));

    localStorage.setItem(LOCALSTORAGE_BACKUP_KEY, JSON.stringify(data));

    logger.info(`Auto-saved ${Object.keys(files).length} files to localStorage for chat ${chatId}`);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logger.warn('localStorage quota exceeded, clearing old data...');
      clearOldAutoSaves();

      try {
        const data = {
          chatId,
          files,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCALSTORAGE_BACKUP_KEY, JSON.stringify(data));
      } catch (retryError) {
        logger.error('Failed to save files even after clearing old data', retryError);
      }
    } else {
      logger.error('Failed to save files to localStorage', error);
    }
  }
}

export function loadFilesFromLocalStorage(chatId: string): FileMap | null {
  try {
    const data = localStorage.getItem(`${LOCALSTORAGE_KEY_PREFIX}-${chatId}`);

    if (data) {
      const parsed = JSON.parse(data);
      logger.info(`Loaded ${Object.keys(parsed.files || {}).length} files from localStorage for chat ${chatId}`);

      return parsed.files || null;
    }

    const backupData = localStorage.getItem(LOCALSTORAGE_BACKUP_KEY);

    if (backupData) {
      const parsed = JSON.parse(backupData);

      if (parsed.chatId === chatId) {
        logger.info(
          `Loaded ${Object.keys(parsed.files || {}).length} files from backup localStorage for chat ${chatId}`,
        );

        return parsed.files || null;
      }
    }

    return null;
  } catch (error) {
    logger.error('Failed to load files from localStorage', error);
    return null;
  }
}

function clearOldAutoSaves(): void {
  try {
    const keys = Object.keys(localStorage);
    const autoSaveKeys = keys.filter((key) => key.startsWith(LOCALSTORAGE_KEY_PREFIX));

    const keysWithTimestamps = autoSaveKeys
      .map((key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          return { key, timestamp: data.timestamp || 0 };
        } catch {
          return { key, timestamp: 0 };
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    const keysToDelete = keysWithTimestamps.slice(0, Math.floor(keysWithTimestamps.length / 2));

    keysToDelete.forEach(({ key }) => {
      localStorage.removeItem(key);
    });

    logger.info(`Cleared ${keysToDelete.length} old auto-save entries`);
  } catch (error) {
    logger.error('Failed to clear old auto-saves', error);
  }
}

export async function saveSnapshot(chatId: string, messageId: string, files: FileMap): Promise<void> {
  if (!db) {
    logger.warn('Database not available, skipping snapshot save');
    return;
  }

  try {
    const snapshot: Snapshot = {
      chatIndex: messageId,
      files,
    };

    await setSnapshot(db, chatId, snapshot);

    saveFilesToLocalStorage(chatId, files);

    logger.info(`Saved snapshot for chat ${chatId} with ${Object.keys(files).length} files`);
  } catch (error) {
    logger.error('Failed to save snapshot', error);

    saveFilesToLocalStorage(chatId, files);
  }
}

export async function loadSnapshot(chatId: string): Promise<Snapshot | null> {
  try {
    if (!db) {
      logger.warn('Database not available, falling back to localStorage');

      const files = loadFilesFromLocalStorage(chatId);

      if (files) {
        return {
          chatIndex: '',
          files,
        };
      }

      return null;
    }

    const snapshot = await getSnapshot(db, chatId);

    if (snapshot && snapshot.files) {
      logger.info(`Loaded snapshot for chat ${chatId} with ${Object.keys(snapshot.files).length} files from IndexedDB`);
      return snapshot;
    }

    const files = loadFilesFromLocalStorage(chatId);

    if (files) {
      logger.info(`Loaded ${Object.keys(files).length} files from localStorage fallback`);

      return {
        chatIndex: '',
        files,
      };
    }

    return null;
  } catch (error) {
    logger.error('Failed to load snapshot, trying localStorage fallback', error);

    const files = loadFilesFromLocalStorage(chatId);

    if (files) {
      return {
        chatIndex: '',
        files,
      };
    }

    return null;
  }
}

export function startAutoSave(getFiles: () => FileMap, getMessageId: () => string): () => void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  logger.info(`Starting auto-save with ${AUTO_SAVE_INTERVAL}ms interval`);

  const performSave = async () => {
    const chatId = getCurrentChatId();

    if (!chatId) {
      return;
    }

    const files = getFiles();
    const currentHash = getFileHash(files);

    if (currentHash === lastSavedHash) {
      return;
    }

    const messageId = getMessageId();

    const saveOperation = async () => {
      await saveSnapshot(chatId, messageId, files);
      lastSavedHash = currentHash;
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          saveOperation();
        },
        { timeout: 5000 },
      );
    } else {
      await saveOperation();
    }
  };

  autoSaveTimer = setInterval(performSave, AUTO_SAVE_INTERVAL);

  return () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
      logger.info('Stopped auto-save');
    }
  };
}

export function saveFilesImmediately(files: FileMap, messageId: string): void {
  const chatId = getCurrentChatId();

  if (!chatId) {
    logger.warn('No chat ID available, skipping immediate save');
    return;
  }

  saveSnapshot(chatId, messageId, files);
}
