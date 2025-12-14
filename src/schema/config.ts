import { destination } from 'pino';
import z from 'zod';

export const schema = z.strictObject({
  //  Should be coming directly from env file
  env: z.enum(['production', 'beta', 'staging', 'dev']),
  dbUrl: z.string().min(1).optional(),
  jwt: z.strictObject({
    secret: z.string().min(1),
  }),

  // Should be coming from config file
  deployment: z.enum(['server', 'api']),
  port: z.number(),
  serverUrl: z.string().min(1),
  log: z
    .strictObject({
      level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
      // Add more transports here if needed
      transports: z.array(z.enum(['file', 'logtail', 'elasticsearch'])),
      file: z
        .strictObject({
          frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
          destination: z.string().min(1),
          size: z.string().min(1),
          count: z.number().min(1),
          extension: z.string().min(1),
        })
        .optional(),
      logtail: z
        .strictObject({
          sourceToken: z.string().min(1),
        })
        .optional(),
      elasticSearch: z
        .strictObject({
          index: z.string().min(1),
          node: z.string().min(1),
          esVersion: z.string().min(1),
          flushBytes: z.number().min(1),
        })
        .optional(),
    })
    .superRefine((arg, ctx) => {
      const { transports, file, logtail, elasticSearch } = arg;
      transports.forEach((transport) => {
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

        if (transport === 'elasticsearch' && !elasticSearch) {
          return ctx.addIssue({
            code: 'custom',
            message: 'Elasticsearch transport requires elasticSearch configuration',
          });
        }
      });
    }),
  s3: z.strictObject({
    region: z.string().min(1),
    bucket: z.string().min(1),
    host: z.string().min(1),
  }),
  ratelimit: z.strictObject({
    enabled: z.boolean(),
    windowMs: z.number().min(1),
    max: z.number().min(1),
    whitelist: z.array(z.string().min(1)),
  }),
  redis: z.strictObject({
    url: z.string().min(1),
  }),
});

export type Config = z.infer<typeof schema>;
