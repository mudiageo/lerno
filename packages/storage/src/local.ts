import * as fs from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import * as path from 'node:path';
import { type StorageProvider } from './provider';

export class LocalProvider implements StorageProvider {
  private storagePath: string;
  private publicUrl: string;

  constructor(config: { storagePath: string; publicUrl: string }) {
    this.storagePath = config.storagePath;
    this.publicUrl = config.publicUrl;
  }

  private async ensureDir(filePath: string) {
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async upload(key: string, body: Buffer | ReadableStream, contentType: string) {
    const fullPath = path.join(this.storagePath, key);
    await this.ensureDir(fullPath);

    if (Buffer.isBuffer(body)) {
      await fs.writeFile(fullPath, body);
    } else {
      // Handle ReadableStream by converting to AsyncIterable or buffering
      const reader = body.getReader();
      const stream = createWriteStream(fullPath);
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          stream.write(value);
        }
      } finally {
        stream.end();
        reader.releaseLock();
      }
    }

    // Return the public URL
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string) {
    return `${this.publicUrl}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn = 3600) {
    // For local storage, URLs don't need signing in the same way, we just return the public URL directly.
    return this.getPublicUrl(key);
  }

  async delete(key: string) {
    const fullPath = path.join(this.storagePath, key);
    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
  }

  async download(key: string) {
    const fullPath = path.join(this.storagePath, key);
    return await fs.readFile(fullPath);
  }
}
