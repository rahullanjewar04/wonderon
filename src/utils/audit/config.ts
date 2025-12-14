interface AuditConfigDetails {
  track: boolean;
  redact: string[];
  exclude: string[];
}

interface AuditConfigMap {
  [key: string]: AuditConfigDetails;
}

export const auditConfig: AuditConfigMap = {
  user: {
    track: true,
    redact: ['credentials'],
    exclude: ['credentials'],
  },
  book: {
    track: true,
    redact: [],
    exclude: ['updatedAt'],
  },
};
