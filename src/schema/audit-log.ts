import z from 'zod';

export const schema = z.strictObject({
  entity: z.enum(['USER', 'BOOK']),
  entityId: z.string().min(1),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  diff: z.record(z.any(), z.any()).optional(),
  requestId: z.uuidv4(),
  ip: z.union([z.ipv4(), z.ipv6()]),
  master: z.boolean().default(false),
  actorId: z.uuidv4().optional(),
});

const listFilters = schema
  .omit({ diff: true })
  .extend({
    from: z.date(),
    to: z.date(),
    fieldsChanged: z.array(z.string().min(1)),
  })
  .partial();

// Get all top-level keys
type ListSortKeys = keyof z.infer<typeof listFilters>;
const listSortKeys = Object.keys(listFilters.shape) as ListSortKeys[];

// Create Zod enum from keys
const listSortEnum = z.enum(listSortKeys);

export const listSchema = z.strictObject({
  filters: listFilters.optional(),
  take: z.number().min(1).max(100).default(10),
  sort: z.strictObject({
    field: listSortEnum,
    order: z.enum(['asc', 'desc']),
  }),
  cursor: z.string().min(1).optional(),
});

export type AuditLog = z.infer<typeof schema>;
export type AuditLogList = z.infer<typeof listSchema>;
