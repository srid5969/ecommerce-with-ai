/**
 * Single source of truth for configuration.
 * Validates environment variables once at startup (fail fast) and exposes a typed, frozen object.
 * Nothing else in the codebase should read `process.env` directly.
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  /** Base URL of the external product catalog API (list: GET /, details: GET /:slug). */
  CATALOG_API_URL: z.url(),
  OLLAMA_HOST: z.url().default('http://localhost:11434'),
  /** Ollama model used by the chat assistant (should support "thinking"). */
  CHAT_MODEL: z.string().min(1).default('qwen3.5:4b'),
  /** Let the chat model reason before answering (shown in the UI). Slower, especially on CPU. */
  CHAT_THINK: z.stringbool().default(true),
  /** Model context window (tokens). Must fit prompt + products + reasoning + answer. */
  CHAT_CONTEXT_TOKENS: z.coerce.number().int().positive().default(8192),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
}

export const env = loadEnv();
