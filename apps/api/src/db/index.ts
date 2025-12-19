import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'node:path';

// Load root .env even when running from apps/api
dotenvConfig({ path: resolve(process.cwd(), '../../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Create a .env at repo root (copy from .env.example).');
}

/**
 * postgres.js client.
 * - `prepare: false` is a safe default for Bun environments.
 * - Increase `max` if you need more concurrency later.
 */
export const sql = postgres(databaseUrl, {
  max: 10,
  prepare: false,
});

export const db = drizzle(sql);
