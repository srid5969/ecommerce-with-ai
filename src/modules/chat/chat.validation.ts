import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  /** Previous turns, oldest first (lets the assistant handle follow-up questions). */
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(8000),
      }),
    )
    .max(50)
    .default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
