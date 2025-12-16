import * as jwt from 'jsonwebtoken';
import { AppError } from './error';

export interface JwtPayload {
  id: string;
  name: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

export type CreateJwtPayload = Omit<JwtPayload, 'iat' | 'exp'>;

export class Jwt {
  private static instance: Jwt | null = null;
  private readonly secret: string;

  private constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Singleton JWT service.
   *
   * Initialize the service once with a secret key and get the same instance
   * on subsequent calls.
   *
   * @param secret - secret key for JWT signing and verification
   * @returns - singleton JWT service instance
   */
  static getInstance(secret?: string): Jwt {
    if (!Jwt.instance) {
      if (!secret) {
        throw new Error('secret is required on first instantiation');
      }
      Jwt.instance = new Jwt(secret);
    }
    return Jwt.instance;
  }
  /**
   * Create a JWT token for a user.
   *
   * @param payload - user data to be embedded in the JWT token
   * @returns - JWT token
   */
  createToken(payload: CreateJwtPayload): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      /**
       * Issued at (current time)
       */
      iat: now,
      /**
       * Expiration time (7 days from now)
       */
      exp: now + 60 * 60 * 24 * 7, // 7 days from now (seconds)
    };

    /**
     * Sign the payload with the secret key using HS256 algorithm
     */
    return jwt.sign(fullPayload, this.secret, {
      algorithm: 'HS256',
    });
  }

  /**
   * Validates a JWT token by verifying its signature and checking its expiration.
   *
   * @param token - JWT token to be validated
   * @returns - payload of the JWT token if it is valid
   * @throws AppError - if the token is invalid, expired or has an invalid signature
   */
  validate(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.secret) as jwt.JwtPayload & JwtPayload;

      // Explicit expiration check
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      // JWT library throws different errors for different types of validation errors
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(AppError.FORBIDDEN, 'Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(AppError.FORBIDDEN, 'Invalid token');
      } else {
        throw new AppError(AppError.FORBIDDEN, 'Token validation failed');
      }
    }
  }
}
