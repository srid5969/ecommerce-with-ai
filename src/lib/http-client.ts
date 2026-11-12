/**
 * Minimal JSON HTTP client: timeout, retry with exponential backoff, and
 * zod validation of the response payload.
 * Retries network errors, timeouts, 429 and 5xx; never retries other 4xx or invalid payloads.
 */
import { z } from 'zod';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
  }
}

export class PayloadValidationError extends Error {
  constructor(
    readonly url: string,
    readonly issues: string,
  ) {
    super(`Unexpected response payload from ${url}:\n${issues}`);
    this.name = 'PayloadValidationError';
  }
}

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = { retries: 3, baseDelayMs: 500, timeoutMs: 15_000 };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 429 || error.status >= 500;
  return true; // network error / timeout
}

async function fetchRawJson(url: string, options: RetryOptions): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (!response.ok) throw new HttpError(response.status, url);
      return await response.json();
    } catch (error) {
      if (attempt >= options.retries || !isRetryable(error)) throw error;
      await sleep(options.baseDelayMs * 2 ** attempt);
    }
  }
}

/** Fetches JSON and validates it against `schema`; returns the parsed (typed) data. */
export async function fetchJson<Schema extends z.ZodType>(
  url: string,
  schema: Schema,
  options: Partial<RetryOptions> = {},
): Promise<z.output<Schema>> {
  const json = await fetchRawJson(url, { ...DEFAULT_OPTIONS, ...options });
  const result = schema.safeParse(json);
  if (!result.success) throw new PayloadValidationError(url, z.prettifyError(result.error));
  return result.data;
}
