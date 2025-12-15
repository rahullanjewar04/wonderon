interface AuditConfigDetails {
  track: boolean;
  redact: string[];
  exclude: string[];
}

export const auditConfig: Record<string, AuditConfigDetails> = {
  user: { track: true, redact: ['credentials'], exclude: ['credentials'] },
  book: { track: true, redact: [], exclude: ['updatedAt'] },
};
