/**
 * merge-schemas.ts
 * ────────────────
 * Runs after `vpx auth generate` to patch the generated auth.tmp.ts:
 *   1. Inject extra imports and enum definitions.
 *   2. Override column types in the users table (uuid, varchar, pgEnum…).
 *   3. Add table-level indexes to the users table.
 *   4. Fix userId FK columns in sessions/accounts to use the correct type.
 *   5. Write the result to auth.ts.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  extraImports,
  enumDefinitions,
  columnOverrides,
  extraColumns,
  userIndexes,
  userIdType,
} from "./user-extensions.js";

const DB_SCHEMA_DIR = join(process.cwd(), "..", "db", "src", "schema");
const TMP_PATH = join(DB_SCHEMA_DIR, "auth.tmp.ts");
const FINAL_PATH = join(DB_SCHEMA_DIR, "auth.ts");

function main() {
  if (!existsSync(TMP_PATH)) {
    console.error(`❌  ${TMP_PATH} not found – did the auth CLI run?`);
    process.exit(1);
  }

  let src = readFileSync(TMP_PATH, "utf-8");

  // ── 1. Inject extra imports right after the existing import block ──
  const lastImportIdx = src.lastIndexOf("from \"drizzle-orm/pg-core\";");
  if (lastImportIdx !== -1) {
    const insertPos = src.indexOf(";", lastImportIdx) + 1;
    src =
      src.slice(0, insertPos) +
      "\n" +
      extraImports.join("\n") +
      "\n" +
      src.slice(insertPos);
  }

  // ── 2. Inject enum definitions before the users table ──
  const usersTableMatch = src.indexOf("export const users = pgTable(");
  if (usersTableMatch !== -1) {
    src =
      src.slice(0, usersTableMatch) +
      enumDefinitions.join("\n") +
      "\n\n" +
      src.slice(usersTableMatch);
  }

  // ── 3. Override column types in the users table only ──
  const usersBlockRegex = /export const users = pgTable\("users",\s*\{([\s\S]*?)\}\);/;
  const usersBlockMatch = src.match(usersBlockRegex);
  if (usersBlockMatch) {
    let usersBlock = usersBlockMatch[1];
    for (const [colName, replacement] of Object.entries(columnOverrides)) {
      const regex = new RegExp(
        `(  ${colName}: )\\w+\\([^)]*\\)([^,}]*)(,?)`,
        "g"
      );
      usersBlock = usersBlock.replace(regex, `  ${colName}: ${replacement}$3`);
    }
    src = src.replace(usersBlockRegex, `export const users = pgTable("users", {${usersBlock}});`);
  }

  // ── 4. Add extra columns that are missing ──
  for (const [colName, definition] of Object.entries(extraColumns)) {
    if (!src.includes(`${colName}:`)) {
      // Insert before the closing of the users table object
      src = src.replace(
        /(export const users = pgTable\("users",\s*\{[\s\S]*?)(}\))/,
        `$1  ${colName}: ${definition},\n$2`
      );
    }
  }

  // ── 5. Add indexes to the users table ──
  if (userIndexes.length > 0) {
    // Find the users table definition and check if it already has a third arg
    // The generated form: pgTable("users", { ... })
    // We need:            pgTable("users", { ... }, (t) => ({ ...indexes... }))
    const usersClosingPattern = /export const users = pgTable\("users",\s*\{([\s\S]*?)\}\);/;
    const match = src.match(usersClosingPattern);
    if (match) {
      const tableBody = match[1];
      const indexBlock = userIndexes.join(",\n  ");
      const replacement = `export const users = pgTable("users", {${tableBody}}, (t) => ({\n  ${indexBlock}\n}));`;
      src = src.replace(usersClosingPattern, replacement);
    }
  }

  // ── 6. Fix userId FK type in sessions / accounts ──
  if (userIdType === "uuid") {
    src = src.replace(/userId: text\("user_id"\)/g, `userId: uuid("user_id")`);
  }

  // ── 7. Write final output ──
  writeFileSync(FINAL_PATH, src);
  console.log(`✅  Merged auth schema → ${FINAL_PATH}`);

  // Clean up tmp file
  unlinkSync(TMP_PATH);
  console.log(`🗑️  Removed ${TMP_PATH}`);
}

main();
