export {};

declare global {
  namespace PrismaJson {
    type AuditSettings = {
      enabled: boolean;
      retention: {
        // in days
        period: number;
      };
    };
  }

  namespace Express {
    export interface Request {
      user: {
        id: string;
        name: string;
        role: string;
      };
    }
  }
}
