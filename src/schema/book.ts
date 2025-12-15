import { z } from 'zod';
import { DEFAULT_TAKE } from './common';

const schema = z.strictObject({
  title: z.string().min(1).max(100),
  authors: z.string().min(1).max(50),
  createdBy: z.uuidv4(),
  publishedBy: z.string().min(1).max(50),
  updatedBy: z.uuidv4().optional(),
  deleted: z.boolean(),
});

const createOrUpdateSchema = schema.extend({
  deleted: schema.shape.deleted.optional(),
});
export const bookCreateServer = createOrUpdateSchema.extend({
  deleted: schema.shape.deleted.default(false).optional(),
});
export const bookCreateClient = createOrUpdateSchema.omit({ createdBy: true, updatedBy: true, deleted: true });
export const bookUpdateServer = createOrUpdateSchema.partial();
export const bookUpdateClient = createOrUpdateSchema
  .omit({ createdBy: true, updatedBy: true, deleted: true })
  .partial();

const listFilters = schema.omit({ deleted: true }).partial();

// Get all top-level keys
type ListSortKeys = keyof z.infer<typeof listFilters>;
const listSortKeys = Object.keys(listFilters.shape) as ListSortKeys[];

// Create Zod enum from keys
const listSortEnum = z.enum(listSortKeys);

export const listBooksSchema = z.strictObject({
  filters: listFilters.optional(),
  take: z.number().min(1).max(100).default(DEFAULT_TAKE),
  sort: z.strictObject({
    field: listSortEnum,
    order: z.enum(['asc', 'desc']),
  }),
  cursor: z.string().min(1).optional(),
});

export type BookCreateServer = z.infer<typeof bookCreateServer>;
export type BookCreateClient = z.infer<typeof bookCreateClient>;
export type BookUpdateServer = z.infer<typeof bookUpdateServer>;
export type BookUpdateClient = z.infer<typeof bookUpdateClient>;
export type BookList = z.infer<typeof listBooksSchema>;
