import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const envFiles = [
	`.env.${process.env.NODE_ENV ?? "development"}.local`,
	`.env.${process.env.NODE_ENV ?? "development"}`,
	".env.local",
	".env"
];

if (!process.env.DATABASE_URL) {
	for (const envFile of envFiles) {
		const envPath = path.resolve(process.cwd(), envFile);
		if (!fs.existsSync(envPath)) continue;
		dotenv.config({ path: envPath });
		if (process.env.DATABASE_URL) break;
	}
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error("DATABASE_URL is not set");

const client = postgres(dbUrl);

export const db = drizzle(client, { schema });
