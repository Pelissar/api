import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3333),
    DATABASE_URL: z.string().min(1).refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
        message: 'DATABASE_URL deve comecar com postgresql:// ou postgres://'
    }),
    DIRECT_URL: z
        .string()
        .optional()
        .refine((value) => !value || value.startsWith('postgresql://') || value.startsWith('postgres://'), {
        message: 'DIRECT_URL deve comecar com postgresql:// ou postgres://'
    }),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(1440).default(15),
    JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    ADMIN_SEED_EMAIL: z.string().default('lucaspelissar@hotmail.com'),
    ADMIN_SEED_PASSWORD: z.string().default('Ctrl@1004'),
    CORS_ORIGIN: z.string().default('*'),
    STORAGE_DIR: z
        .string()
        .default(path.resolve(process.cwd(), 'storage'))
        .transform((value) => (path.isAbsolute(value) ? value : path.resolve(process.cwd(), value))),
    DEFAULT_TENANT_SLUG: z.string().default('default')
});
export const env = envSchema.parse(process.env);
