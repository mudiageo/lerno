import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const here = dirname(fileURLToPath(import.meta.url));
const client = postgres(url, { max: 1, connectTimeout: 60, idleTimeout: 1 });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: resolve(here, 'migrations') });
  console.log('Migrations applied successfully');
} finally {
  await client.end();
}
