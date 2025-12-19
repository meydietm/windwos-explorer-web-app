import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { resolve } from 'node:path';
import { db, sql } from './index';

async function main() {
  const migrationsFolder = resolve(process.cwd(), 'drizzle');
  await migrate(db, { migrationsFolder });
  await sql.end({ timeout: 5 });
  // eslint-disable-next-line no-console
  console.log('✅ Migrations applied.');
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Migration failed:', err);
  try {
    await sql.end({ timeout: 5 });
  } catch {
    // ignore
  }
  process.exit(1);
});
