import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

function createDatabase(url: string) {
  return drizzle(postgres(url), { schema });
}

type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

function getDb(): Database {
  if (!database) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set');
    database = createDatabase(dbUrl);
  }
  return database;
}

// Defer connecting until the first query so builds (which analyse routes
// without runtime secrets) do not need DATABASE_URL at module load time.
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, property, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
