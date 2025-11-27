import { ipcMain } from 'electron';
import { db } from '../../app/IPC/db';
import { users } from '../../app/IPC/db/schema';
import { eq } from 'drizzle-orm';
import { createScopedLogger } from '../../app/utils/logger';
import { logStore } from '../../app/lib/stores/logs';

const logger = createScopedLogger('Databaseipc');

export function setupDatabaseHandlers() {
  // Register user handler
  ipcMain.handle(
    'database:register-user',
    async (
      _,
      userData: {
        id: string;
        fullName: string;
        email: string;
        appVersion: string;
        platform: string;
        emailOptIn: boolean;
      },
    ) => {
      try {
        logger.debug('Registering user', { userId: userData.id, email: userData.email });

        // Check if email already exists
        const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);

        if (existingUser.length > 0) {
          logger.warn('Email already registered', { email: userData.email });
          return { success: false, error: 'Email already registered' };
        }

        // Insert new user
        await db.insert(users).values({
          id: userData.id,
          fullName: userData.fullName,
          email: userData.email,
          appVersion: userData.appVersion,
          platform: userData.platform,
          emailOptIn: userData.emailOptIn,
        });

        logStore.logSystem('User registered successfully', {
          userId: userData.id,
          email: userData.email,
        });

        return { success: true, userId: userData.id };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Database error';
        logger.error('User registration failed', { error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
  );

  // Get user handler
  ipcMain.handle('database:get-user', async (_, userId: string) => {
    try {
      logger.debug('Getting user', { userId });

      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      const user = userResult[0] || null;

      if (user) {
        logger.debug('User found', { userId, email: user.email });
      } else {
        logger.debug('User not found', { userId });
      }

      return { success: true, user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database error';
      logger.error('Get user failed', { error: errorMessage, userId });

      return {
        success: false,
        error: errorMessage,
      };
    }
  });

  // Update user last login
  ipcMain.handle('database:update-last-login', async (_, userId: string) => {
    try {
      logger.debug('Updating last login', { userId });

      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, userId));

      logger.debug('Last login updated', { userId });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database error';
      logger.error('Update last login failed', { error: errorMessage, userId });

      return {
        success: false,
        error: errorMessage,
      };
    }
  });
}
