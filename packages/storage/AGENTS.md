# 📦 Storage Package (@lerno/storage)

This package provides a unified interface for file storage, supporting Cloudflare R2 (S3-compatible) and Local Filesystem.

## 🚀 Usage

Always use the exported `storage` singleton instead of instantiating providers directly.

```typescript
import { storage } from '@lerno/storage';

const url = await storage.upload('my-file.txt', Buffer.from('hello'), 'text/plain');
```

### Methods
- `upload(key: string, buffer: Buffer, mimeType: string): Promise<string>`: Uploads a file and returns its public URL.
- `download(key: string): Promise<Buffer>`: Downloads a file by its key.
- `delete(key: string): Promise<void>`: Deletes a file.

## 🛠️ Configuration

Switch between providers using `STORAGE_TYPE` in your `.env`.

### 1. Cloudflare R2 (`STORAGE_TYPE=r2`)
Requires:
- `R2_ENDPOINT`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

### 2. Local Storage (`STORAGE_TYPE=local`)
Uses:
- `LOCAL_STORAGE_PATH`: Defaults to `apps/web/static/uploads`.
- `LOCAL_PUBLIC_URL`: Defaults to `/uploads`.

## 🛠️ Development Rules for Agents

- **Provider-Agnostic**: Code against the `StorageProvider` interface. Never reference `R2Provider` or `LocalProvider` directly in application logic.
- **Paths**: Ensure keys are hierarchical (e.g., `ai/images/uuid.png`) for organization.
- **MimeTypes**: Always provide accurate `mimeType` for correct browser handling (e.g., `video/mp4`, `image/png`).
