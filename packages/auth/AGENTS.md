# 🔐 Authentication Package (@lerno/auth)

This package manages all user authentication, authorization (RBAC), and session management for Lerno, built with [Better Auth](https://www.better-auth.com/).

## 🚀 Core Features

### 1. Better Auth Integration
- Entry point [src/index.ts](./src/index.ts) defines the Better Auth instance and shared configuration.
- Supports OAuth and Database adapter patterns via `@lerno/db`.
- Schema generation and synchronization is handled via `vp run auth:schema`.

### 2. RBAC (Role-Based Access Control)
Defined in [src/rbac.ts](./src/rbac.ts).
- `Roles`: `USER`, `MODERATOR`, `ADMIN`, `OWNER`.
- helper `hasPermission(user, permission)`: Checks if a user has the appropriate role.

### 3. Audit Logging
Implemented in [src/audit.ts](./src/audit.ts).
- Automatically logs sensitive security events (Login, Password Change, Critical Actions) to the database.

## 🛠️ Development Rules for Agents

- **Session Security**: Always use the provided auth client helpers or the standard Better Auth session verification before performing any data mutation.
- **RBAC**: Never hardcode role checks in application logic. Always use the `rbac` utility functions to check for permissions.
- **Privacy**: Be mindful of PII (Personally Identifiable Information) in audit logs. Never log passwords or full sensitive tokens.
- **Database Schema**: Auth tables in `@lerno/db` are derived from Better Auth. Use the `auth:schema` script to update them if configuration changes.
