/**
 * AuditConfigDetails is the type used to configure audit logging per Prisma model.
 *
 * track: Whether to track this model at all.
 *
 * redact: Paths to redact when generating audit logs. This list is used to both
 * exclude sensitive data from logs and to redact sensitive values with a placeholder.
 *
 * exclude: Paths to exclude from audit logs entirely. This list is used to skip
 * certain fields when generating audit logs.
 */
interface AuditConfigDetails {
  track: boolean;
  redact: string[];
  exclude: string[];
}

export const auditConfig: Record<string, AuditConfigDetails> = {
  user: { track: true, redact: ['credentials'], exclude: ['credentials'] },
  book: { track: true, redact: [], exclude: ['updatedAt'] },
};
