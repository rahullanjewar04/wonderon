import { z } from 'zod';

const schema = z.strictObject({
  title: z.string().min(1).max(100),
  authors: z.string().min(1).max(50),
  createdBy: z.uuidv4(),
  publishedBy: z.string().min(1).max(50),
  updatedBy: z.uuidv4().optional(),
});

export const bookCreateServer = schema;
export const bookCreateClient = schema.omit({ createdBy: true, updatedBy: true });
export const bookUpdateServer = schema.partial();
export const bookUpdateClient = schema.omit({ createdBy: true, updatedBy: true }).partial();

export type BookCreateServer = z.infer<typeof bookCreateServer>;
export type BookCreateClient = z.infer<typeof bookCreateClient>;
export type BookUpdateServer = z.infer<typeof bookUpdateServer>;
export type BookUpdateClient = z.infer<typeof bookUpdateClient>;
