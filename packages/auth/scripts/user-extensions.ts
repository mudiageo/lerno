/**
 * User Extensions Configuration
 * ──────────────────────────────
 * This file defines custom columns, indexes, imports, and type overrides
 * that the merge script injects into the CLI-generated auth.ts.
 *
 * To add a new field to the users table:
 *   1. Add it to `additionalFields` in packages/auth/src/index.ts
 *      (so Better Auth knows about it at runtime).
 *   2. Add any Drizzle-specific overrides here (e.g. pgEnum, uuid, varchar
 *      with length, indexes, self-references).
 *
 * Fields that Better Auth already generates correctly (plain text, boolean,
 * integer, timestamp) do NOT need an override here.
 */

/** Extra imports to add at the top of auth.ts */
export const extraImports = [
  `import { sql } from "drizzle-orm";`,
  `import { pgEnum, uuid, varchar } from "drizzle-orm/pg-core";`,
];

/** Enum definitions to inject before the users table */
export const enumDefinitions = [
  `export const themeEnum = pgEnum('theme', ['light', 'dark', 'oled', 'system']);`,
  `export const planEnum  = pgEnum('plan', ['free', 'premium', 'institutional']);`,
];

/**
 * Column type overrides for the users table.
 * key   = column name as it appears in the generated code (e.g. "id")
 * value = full Drizzle column definition to replace the generated one
 *
 * Columns listed here completely replace their generated counterpart.
 */
export const columnOverrides: Record<string, string> = {
  // Use UUID for the primary key
  id: `uuid('id').primaryKey().defaultRandom()`,

  // Use varchar with length constraints
  username: `varchar('username', { length: 40 }).unique().notNull()`,
  displayName: `varchar('display_name', { length: 80 })`,
  email: `varchar('email', { length: 255 }).unique().notNull()`,
  referralCode: `varchar('referral_code', { length: 16 }).unique()`,

  // Use pgEnum types
  plan: `planEnum('plan').default('free').notNull()`,
  theme: `themeEnum('theme').default('system')`,

  // Self-referencing UUID
  referredBy: `uuid('referred_by').references((): any => users.id)`,

  // Institution FK
  institutionId: `uuid('institution_id')`,
};

/**
 * Extra columns to add if they are missing from the generated output.
 * These are columns that Better Auth doesn't know about but you need in
 * the users table.
 */
export const extraColumns: Record<string, string> = {
  // none currently — all fields are declared via additionalFields
};

/**
 * Table-level index definitions to inject into the users table's
 * third argument (the index callback).
 */
export const userIndexes = [
  `idx_users_username_trgm: index('idx_users_username_trgm').using('gin', sql\`\${t.username} gin_trgm_ops\`)`,
];

/**
 * userId type override for FK columns in sessions / accounts tables.
 * Set to "uuid" to match the users.id type.
 */
export const userIdType = "uuid";
