export interface StorageProvider {
  upload(key: string, body: Buffer | ReadableStream, contentType: string): Promise<string>; // returns URL
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getPublicUrl(key: string): string;
}
