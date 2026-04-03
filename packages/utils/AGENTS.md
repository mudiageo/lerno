# 🛠️ Utilities Package (@lerno/utils)

This package contains shared TypeScript helper functions, constants, and type utilities used across the Lerno monorepo.

## 🚀 Usage

Import standard utilities from the main entry point:

```typescript
import { formatDate, slugify } from '@lerno/utils';
```

## 🏗️ Structure

- [src/index.ts](./src/index.ts): Main entry point exporting all shared logic.
- `src/date.ts`: Date formatting and manipulation (using dayjs/date-fns).
- `src/string.ts`: String manipulation, slugification, and sanitization.
- `src/types.ts`: Shared TypeScript interfaces and utility types.

## 🛠️ Development Rules for Agents

- **Zero Dependencies**: Keep this package as lightweight as possible. Avoid adding large external dependencies unless absolutely necessary.
- **Pure Functions**: Utilities should ideally be pure functions with no side effects.
- **Testing**: Ensure all new utility functions have accompanying unit tests in `vp test`.
- **Naming**: Use descriptive, camelCase names for functions and PascalCase for types and interfaces.
