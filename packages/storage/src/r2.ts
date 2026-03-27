import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type StorageProvider } from './provider';

export class R2Provider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;
  
  constructor(config: { endpoint: string; accessKey: string; secretKey: string; bucket: string; publicUrl: string }) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
  }
  
  async upload(key: string, body: Buffer | ReadableStream, contentType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: body, ContentType: contentType,
    }));
    return this.getPublicUrl(key);
  }
  
  getPublicUrl(key: string) { return `${this.publicUrl}/${key}`; }
  
  async getSignedUrl(key: string, expiresIn = 3600) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
  
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  
  async download(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
}
