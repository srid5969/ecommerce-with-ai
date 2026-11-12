import type { Product } from '../../db/schema.ts';
import { generateProductsEmbedding } from '../../lib/embedding.ts';
import type { ProductEmbedder } from '../../modules/products/product-embedder.ts';

/** Adapter: exposes the Ollama embedding call as a ProductEmbedder. */
export class OllamaProductEmbedder implements ProductEmbedder {
  async embed(product: Product): Promise<number[]> {
    const embedding = await generateProductsEmbedding(product);
    if (!embedding) throw new Error(`Ollama returned no embedding for product "${product.slug}"`);
    return embedding;
  }
}
