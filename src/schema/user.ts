import z from 'zod';

export const schema = z.strictObject({
  name: z.string().min(1).max(50),
  role: z.enum(['reviewer', 'admin']),
  email: z.email(),
  credentials: z.string().min(1),
});

export const loginSchema = z.strictObject({
  email: z.email(),
  credentials: z.string().min(1),
});

export const userCreateServer = schema;
export const userCreateClient = schema;
export const userUpdateServer = schema.partial();
export const userUpdateClient = schema.partial();

export type UserCreateServer = z.infer<typeof userCreateServer>;
export type UserCreateClient = z.infer<typeof userCreateClient>;
export type UserUpdateServer = z.infer<typeof userUpdateServer>;
export type UserUpdateClient = z.infer<typeof userUpdateClient>;
export type UserLogin = z.infer<typeof loginSchema>;
