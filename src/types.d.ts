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
}
