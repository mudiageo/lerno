# 🗄️ Database Package (@lerno/db)

This package handles all database operations using [Drizzle ORM](https://orm.drizzle.team/) and [Postgres](file:///c%3A/Users/Admin/lerno/pnpm-workspace.yaml#L28).

## 🚀 Usage

Use the exported `db` client for all queries.

```typescript
import { db, table } from '@lerno/db';
import { eq } from '@lerno/db/drizzle'; //exports from drizzle-orm to avoid type issues with using various versions of drizzle in projects

const result = await db.query.users.findMany({
    where: eq(users.id, id)
});
```

### Schema Organization
Schemas are modular and located in [src/schema/](./src/schema/):
- [users.ts](./src/schema/users.ts): Core user profiles.
- [posts.ts](./src/schema/posts.ts): Feed, shorts, and video metadata.
- [courses.ts](./src/schema/courses.ts): Course content and enrollment.
- [auth.ts](./src/schema/auth.ts): Session and account management (NextAuth compatible).

## 🛠️ Configuration

The database connection is managed via `DATABASE_URL` in your `.env`.

### Migrations
- `vp run generate`: Generates SQL migrations from TypeScript schema.
- `vp run migrate`: Applies pending migrations to the database.

## 🛠️ Development Rules for Agents

- **Typesafe Queries**: Always use Drizzle's relational query API (`db.query`) or the core builder (`db.select()`) for type safety.
- **Foreign Keys**: Ensure all new tables have proper relations defined in the schema.
- **Indexing**: Always index frequently queried columns (e.g., `slug`, `authorId`, `courseId`).
- **Imports**: Export all new schemas from [src/schema/index.ts](./src/schema/index.ts).
