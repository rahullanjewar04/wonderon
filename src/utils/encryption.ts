import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'utf-8';

/**
 * A class providing methods for encrypting and decrypting strings using AES-256-GCM.
 *
 * @class CryptoService
 * @hideconstructor
 * @static
 */
export class CryptoService {
  private static instance: CryptoService | null = null;
  private readonly key: Buffer;

  private constructor(secretKey: string) {
    this.key = crypto.createHash('sha256').update(secretKey).digest().slice(0, 32);
  }

  /**
   * Gets the singleton instance of the CryptoService class.
   * @param encryptionKey - The secret key to use for encryption and decryption.
   * @returns The singleton instance of the CryptoService class.
   * @throws {Error} If encryptionKey is not provided on the first call.
   */
  static getInstance(encryptionKey?: string): CryptoService {
    if (!CryptoService.instance) {
      if (!encryptionKey) {
        throw new Error('encryptionKey is required on first instantiation');
      }
      CryptoService.instance = new CryptoService(encryptionKey);
    }
    return CryptoService.instance;
  }

  /**
   * Encrypt a string using AES-256-GCM.
   * @param data The string to encrypt.
   * @returns The encrypted string in base64 format.
   * @throws {Error} If encryption fails.
   */
  encrypt(data: string): string {
    const iv = crypto.randomBytes(12);
    // Create a cipher using the provided key and initialization vector.
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    // Encrypt the data using the cipher.
    const encrypted = Buffer.concat([cipher.update(data, ENCODING), cipher.final()]);

    // Get the authentication tag from the cipher.
    const authTag = cipher.getAuthTag();

    // Return the encrypted string in base64 format.
    // The format is: iv:encrypted:tag
    return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
  }

  /**
   * Decrypt a string that was previously encrypted with {@link CryptoService.encrypt}.
   * @param encryptedData The string to decrypt.
   * @returns The decrypted string.
   * @throws {Error} If decryption fails.
   */
  decrypt(encryptedData: string): string {
    try {
      // Split the encrypted data into its three components:
      // the initialization vector (iv), the encrypted data, and the authentication tag.
      const [ivB64, dataB64, tagB64] = encryptedData.split(':');

      if (!ivB64 || !dataB64 || !tagB64) {
        // If the encrypted data is invalid, throw an error.
        throw new Error('Invalid encrypted format');
      }

      // Convert the base64-encoded components back into their binary representations.
      const iv = Buffer.from(ivB64, 'base64');
      const encryptedT = Buffer.from(dataB64, 'base64');
      const authTag = Buffer.from(tagB64, 'base64');

      // Create a decipher with the given algorithm, key, and iv.
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      // Set the authentication tag on the decipher.
      decipher.setAuthTag(authTag);

      // Decrypt the encrypted data.
      const decrypted = Buffer.concat([decipher.update(encryptedT), decipher.final()]);

      // Return the decrypted string.
      return decrypted.toString(ENCODING);
    } catch {
      // If decryption fails, throw an error.
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encodes a string into its base64 representation.
   * @param data The string to encode.
   * @returns The base64-encoded string.
   */
  encode(data: string): string {
    // Use Buffer.from to create a buffer from the string, then
    // call toString('base64') to get the base64-encoded string.
    return Buffer.from(data, ENCODING).toString('base64');
  }

  /**
   * Decodes a base64-encoded string into its original string representation.
   * @param data The base64-encoded string to decode.
   * @returns The decoded string.
   */
  decode(data: string): string {
    return Buffer.from(data, 'base64').toString(ENCODING);
  }
}
