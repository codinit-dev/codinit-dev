import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy-loaded database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    try {
      const client = postgres(connectionString, {
        prepare: false,
        ssl: 'require',
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      dbInstance = drizzle(client, { schema });
    } catch (error) {
      console.error('Failed to create database client:', error);
      throw error;
    }
  }

  return dbInstance;
};

// For backward compatibility
export const db = getDb();

// Export types
export type Database = typeof db;
