import type { Config } from 'drizzle-kit';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'node:path';

// Load root .env even when running from apps/api
dotenvConfig({ path: resolve(process.cwd(), '../../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. Create a .env at repo root (copy from .env.example).');
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config;
