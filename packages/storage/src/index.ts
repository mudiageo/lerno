import { type StorageProvider } from './provider';
import { R2Provider } from './r2';
import { LocalProvider } from './local';
import 'dotenv/config';

const storageType = process.env.STORAGE_TYPE || 'local';

export const storage: StorageProvider = storageType === 'r2' 
  ? new R2Provider({
      endpoint:   process.env.R2_ENDPOINT!,
      accessKey:  process.env.R2_ACCESS_KEY!,
      secretKey:  process.env.R2_SECRET_KEY!,
      bucket:     process.env.R2_BUCKET!,
      publicUrl:  process.env.R2_PUBLIC_URL!,
    })
  : new LocalProvider({
      storagePath: process.env.LOCAL_STORAGE_PATH || 'apps/web/static/uploads',
      publicUrl: process.env.LOCAL_PUBLIC_URL || '/uploads',
  });

export * from './provider';
export * from './r2';
export * from './local';
