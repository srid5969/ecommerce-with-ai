import type { ProductSearchResult } from '../products/product.types.ts';

export type ChatStepId = 'search' | 'found' | 'answer';

/**
 * Events streamed to the client (Server-Sent Events; `event:` = `type`).
 * Order: status(search) → status(found) → status(answer) → thinking* / answer* → products → suggestions → done
 */
export type ChatEvent =
  | { type: 'status'; step: ChatStepId; label: string; details?: string[] }
  | { type: 'thinking'; delta: string }
  | { type: 'answer'; delta: string }
  | {
      type: 'products';
      /** `mentioned`: products the answer refers to; `related`: fallback when it names none. */
      match: 'mentioned' | 'related';
      products: ProductSearchResult[];
    }
  | { type: 'suggestions'; questions: string[] }
  | { type: 'done'; model: string; durationMs: number }
  | { type: 'error'; message: string };
