import { db } from '~/IPC/db';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DatabaseHealth');

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    await db.execute('SELECT 1');
    logger.debug('Database health check passed');
    return { healthy: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Database health check failed', { error: errorMessage });
    return {
      healthy: false,
      error: errorMessage,
    };
  }
}

export async function ensureDatabaseConnected(): Promise<void> {
  const health = await checkDatabaseHealth();

  if (!health.healthy) {
    throw new Error(`Database connection failed: ${health.error}`);
  }
}
