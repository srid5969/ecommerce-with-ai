import type { Product } from '../../db/schema.ts';

/**
 * Turns a product into a vector. The embedding service depends on this interface,
 * so the model/provider (Ollama today) can be swapped without touching the use case.
 */
export interface ProductEmbedder {
  embed(product: Product): Promise<number[]>;
}

/** Turns a free-text search query into a vector comparable with product embeddings. */
export interface QueryEmbedder {
  embedQuery(query: string): Promise<number[]>;
}
