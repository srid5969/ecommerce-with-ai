import type { Product } from '../db/schema.ts';

import ollama from 'ollama';

/**
 * Turns a product into the text that gets embedded.
 * Uses EmbeddingGemma's document format: "title: {title} | text: {content}".
 * Empty fields are skipped so they don't add noise to the vector.
 */
export function buildProductEmbeddingText(product: Product): string {
  const clean = (text: string | null) => text?.replace(/\s+/g, ' ').trim();

  const marketing = Object.entries(product.marketingDescription ?? {})
    .map(
      ([heading, value]) =>
        `${heading}: ${value
          .split('|')
          .map((s) => s.trim())
          .join(', ')}`,
    )
    .join('. ');

  const content = [
    product.brand && `Brand: ${product.brand}`,
    product.category && `Category: ${product.category}`,
    clean(product.description),
    marketing,
  ]
    .filter(Boolean)
    .join('\n');

  return `title: ${product.title} | text: ${content}`;
}

export async function getQueryEmbedding(text: string) {
  const data = await ollama.embed({
    model: 'embeddinggemma-2',
    input: `search_query: ${text}`,
  });
  return data.embeddings[0];
}

export async function generateProductsEmbedding(product: Product) {
  const data = await ollama.embed({
    model: 'embeddinggemma-2',
    input: buildProductEmbeddingText(product),
  });
  return data.embeddings[0];
}
