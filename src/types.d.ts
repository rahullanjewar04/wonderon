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
    interface Request {
      user: {
        id: string;
        name: string;
        role: string;
      };
    }
  }
}
