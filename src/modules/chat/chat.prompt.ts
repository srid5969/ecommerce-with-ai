import { cleanText, toHighlights } from '../products/product-text.ts';
import type { ProductSearchResult } from '../products/product.types.ts';
import type { ChatMessage } from './chat-model.ts';
import type { ChatRequest } from './chat.validation.ts';

const MAX_HISTORY_MESSAGES = 6;
const MAX_DESCRIPTION_LENGTH = 250;

export const SYSTEM_PROMPT = `You are the friendly shopping assistant of an online grocery & lifestyle store.

Rules:
- Answer ONLY from the products listed in CATALOG RESULTS. Never invent products or details.
- Only mention products that genuinely match the customer's request; ignore unrelated results.
- Whenever you mention a product, write its title exactly as given, in **bold**.
- Be concise: one short intro sentence, then a bulleted list with a brief reason per product.
- If nothing matches, say so honestly and suggest what the customer could ask instead.
- Prices and stock levels are not available to you; if asked, say so.
- End the answer with one short, friendly question that invites the customer to continue
  (e.g. "Would you like to know more about any of these?").
- Then, on a new line, write exactly "FOLLOW-UPS:" followed by 3 short questions the customer
  might ask next, one per line starting with "- ", written from the customer's point of view.
  They must be answerable from product information (flavours, variants, brands, categories,
  uses, similar products) — never about price, stock, delivery, promotions or reviews.
- Keep your private reasoning brief and focused.`;

function formatProduct(product: ProductSearchResult, index: number): string {
  const lines = [
    `${index + 1}. ${cleanText(product.title)}`,
    `   Brand: ${product.brand ?? 'n/a'} | Category: ${product.category ?? 'n/a'} | SKU: ${product.sku}`,
  ];
  const description = cleanText(product.description, MAX_DESCRIPTION_LENGTH);
  if (description) lines.push(`   Description: ${description}`);
  const highlights = toHighlights(product.marketingDescription);
  if (highlights.length) lines.push(`   Highlights: ${highlights.join(', ')}`);
  return lines.join('\n');
}

/** Builds the full message list for the model: system rules, recent history, then question + context. */
export function buildChatMessages(
  { message, history }: ChatRequest,
  products: ProductSearchResult[],
): ChatMessage[] {
  const context = products.length
    ? products.map(formatProduct).join('\n\n')
    : '(no products found)';

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-MAX_HISTORY_MESSAGES),
    {
      role: 'user',
      content: `CATALOG RESULTS (most relevant first):\n${context}\n\nCUSTOMER QUESTION: ${message}`,
    },
  ];
}
