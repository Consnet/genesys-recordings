import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  GENESYS_REGION: z.string().min(1),
  GENESYS_CLIENT_ID: z.string().min(1),
  GENESYS_CLIENT_SECRET: z.string().min(1),
  ORG_TIMEZONE: z.string().min(1),
  DEFAULT_DAY: z.string().optional(),
  DEFAULT_WINDOW_START: z.string().optional(),
  DEFAULT_WINDOW_END: z.string().optional(),
  DEFAULT_QUEUE_IDS: z.string().optional(),
  DEFAULT_USER_IDS: z.string().optional(),
  DOWNLOAD_DIR: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

export function parseCsv(value: string | undefined): string[] {
  return value
    ? value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];
}

export const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  DOWNLOAD_TIMEOUT_MS: 30000,
  CONCURRENCY_LIMIT: 10,
  BATCH_SIZE: 50,
  MIN_DISK_SPACE_MB: 500,
};
