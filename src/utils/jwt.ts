import * as jwt from 'jsonwebtoken';
import { AppError } from './error';

export interface JwtPayload {
  id: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export class Jwt {
  private static instance: Jwt | null = null;
  private readonly secret: string;

  private constructor(secret: string) {
    this.secret = secret;
  }

  static getInstance(secret?: string): Jwt {
    if (!Jwt.instance) {
      if (!secret) {
        throw new Error('secret is required on first instantiation');
      }
      Jwt.instance = new Jwt(secret);
    }
    return Jwt.instance;
  }
  createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now, // Issued at (current time)
      exp: now + 60 * 60 * 24 * 7, // 7 days from now (seconds)
    };

    return jwt.sign(fullPayload, this.secret, {
      algorithm: 'HS256',
    });
  }

  validate(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.secret) as jwt.JwtPayload & JwtPayload;

      // Explicit expiration check
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
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
