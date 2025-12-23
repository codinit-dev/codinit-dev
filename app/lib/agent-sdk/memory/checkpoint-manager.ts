import type { Checkpoint } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('CheckpointManager');

const DB_NAME = 'codinit_agent_checkpoints';
const DB_VERSION = 1;
const STORE_NAME = 'checkpoints';

export class CheckpointManager {
  private _db: IDBDatabase | null = null;
  private _initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = this._openDatabase();

    return this._initPromise;
  }

  private async _openDatabase(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      logger.warn('IndexedDB not available, checkpointing disabled');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this._db = request.result;
        logger.info('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('threadId', 'threadId', { unique: false });
          store.createIndex('agentId', 'agentId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          logger.info('Created checkpoints object store');
        }
      };
    });
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<string> {
    if (!this._db) {
      logger.warn('Database not initialized, skipping checkpoint save');
      return checkpoint.id;
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(checkpoint);

      request.onsuccess = () => {
        logger.debug(`Saved checkpoint: ${checkpoint.id}`);
        resolve(checkpoint.id);
      };

      request.onerror = () => {
        logger.error('Failed to save checkpoint:', request.error);
        reject(request.error);
      };
    });
  }

  async loadCheckpoint(id: string): Promise<Checkpoint | null> {
    if (!this._db) {
      logger.warn('Database not initialized');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          logger.debug(`Loaded checkpoint: ${id}`);
          resolve(request.result as Checkpoint);
        } else {
          logger.warn(`Checkpoint not found: ${id}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        logger.error('Failed to load checkpoint:', request.error);
        reject(request.error);
      };
    });
  }

  async listCheckpoints(threadId: string): Promise<Checkpoint[]> {
    if (!this._db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('threadId');
      const request = index.getAll(threadId);

      request.onsuccess = () => {
        const checkpoints = (request.result as Checkpoint[]).sort((a, b) => b.timestamp - a.timestamp);

        logger.debug(`Found ${checkpoints.length} checkpoints for thread ${threadId}`);
        resolve(checkpoints);
      };

      request.onerror = () => {
        logger.error('Failed to list checkpoints:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteCheckpoint(id: string): Promise<boolean> {
    if (!this._db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        logger.debug(`Deleted checkpoint: ${id}`);
        resolve(true);
      };

      request.onerror = () => {
        logger.error('Failed to delete checkpoint:', request.error);
        reject(request.error);
      };
    });
  }

  async clearCheckpoints(threadId?: string): Promise<void> {
    if (!this._db) {
      return Promise.resolve();
    }

    if (threadId) {
      const checkpoints = await this.listCheckpoints(threadId);
      await Promise.all(checkpoints.map((cp) => this.deleteCheckpoint(cp.id)));
      logger.info(`Cleared checkpoints for thread ${threadId}`);

      return Promise.resolve();
    } else {
      return new Promise((resolve, reject) => {
        const transaction = this._db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          logger.info('Cleared all checkpoints');
          resolve();
        };

        request.onerror = () => {
          logger.error('Failed to clear checkpoints:', request.error);
          reject(request.error);
        };
      });
    }
  }

  async getLatestCheckpoint(threadId: string): Promise<Checkpoint | null> {
    const checkpoints = await this.listCheckpoints(threadId);
    return checkpoints.length > 0 ? checkpoints[0] : null;
  }

  async close(): Promise<void> {
    if (this._db) {
      this._db.close();
      this._db = null;
      logger.info('Database closed');
    }
  }
}
