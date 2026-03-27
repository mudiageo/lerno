import { type StorageProvider } from './provider';
import { R2Provider } from './r2';

export const storage: StorageProvider = new R2Provider({
  endpoint:   process.env.R2_ENDPOINT!,
  accessKey:  process.env.R2_ACCESS_KEY!,
  secretKey:  process.env.R2_SECRET_KEY!,
  bucket:     process.env.R2_BUCKET!,
  publicUrl:  process.env.R2_PUBLIC_URL!,
});

export * from './provider';
export * from './r2';
