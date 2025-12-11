import z from 'zod';

export const schema = z.strictObject({
  port: z.number(),
  env: z.enum(['production', 'beta', 'staging', 'dev']),
  jwt: z.strictObject({
    secret: z.string().min(1),
  }),
  log: z
    .strictObject({
      level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
      transport: z.enum(['file', 'logtail']),
      file: z
        .strictObject({
          frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
          path: z.string().min(1),
          size: z.string().min(1),
          limit: z.number().min(1),
          extension: z.string().min(1),
        })
        .optional(),
      logtail: z
        .strictObject({
          sourceToken: z.string().min(1),
        })
        .optional(),
    })
    .superRefine((arg, ctx) => {
      const { transport, file, logtail } = arg;
      if (transport === 'file' && !file) {
        return ctx.addIssue({
          code: 'custom',
          message: 'File transport requires file configuration',
        });
      }

      if (transport === 'logtail' && !logtail) {
        return ctx.addIssue({
          code: 'custom',
          message: 'Logtail transport requires logtail configuration',
        });
      }
    }),
  dbUrl: z.string().min(1).optional(),
});

export type Config = z.infer<typeof schema>;
