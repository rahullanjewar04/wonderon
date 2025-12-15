import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'utf-8';

export class CryptoService {
  private static instance: CryptoService | null = null;
  private readonly key: Buffer;

  private constructor(secretKey: string) {
    this.key = crypto.createHash('sha256').update(secretKey).digest().slice(0, 32);
  }

  static getInstance(encryptionKey?: string): CryptoService {
    if (!CryptoService.instance) {
      if (!encryptionKey) {
        throw new Error('encryptionKey is required on first instantiation');
      }
      CryptoService.instance = new CryptoService(encryptionKey);
    }
    return CryptoService.instance;
  }

  encrypt(data: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(data, ENCODING), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
  }

  decrypt(encryptedData: string): string {
    try {
      const [ivB64, dataB64, tagB64] = encryptedData.split(':');

      if (!ivB64 || !dataB64 || !tagB64) {
        throw new Error('Invalid encrypted format');
      }

      const iv = Buffer.from(ivB64, 'base64');
      const encryptedT = Buffer.from(dataB64, 'base64');
      const authTag = Buffer.from(tagB64, 'base64');

      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(encryptedT), decipher.final()]);

      return decrypted.toString(ENCODING);
    } catch {
      throw new Error('Decryption failed');
    }
  }

  encode(data: string): string {
    return Buffer.from(data, ENCODING).toString('base64');
  }

  decode(data: string): string {
    return Buffer.from(data, 'base64').toString(ENCODING);
  }
}
