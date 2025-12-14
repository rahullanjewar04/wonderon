import z from 'zod';

export const createSchema = z.strictObject({
  name: z.string().min(1).max(50),
  role: z.email(),
  credentials: z.string().min(1),
});

export type UserCreate = z.infer<typeof createSchema>;
