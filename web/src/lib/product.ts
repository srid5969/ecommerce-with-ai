import type { Product } from '../types/chat.ts';

/** {"Why you'll love it": "Crunchy | Tasty"} → ["Crunchy", "Tasty"] */
export const toHighlights = (product: Product): string[] =>
  Object.values(product.marketingDescription ?? {})
    .flatMap((value) => value.split('|'))
    .map((item) => item.trim())
    .filter(Boolean);

export const cleanText = (text: string | null): string => (text ?? '').replace(/\s+/g, ' ').trim();

export const productImage = (product: Product): string | null =>
  product.imageUrl ?? product.media?.[0]?.url ?? null;
