import { getQueryEmbedding } from '../../lib/embedding.ts';
import type { QueryEmbedder } from '../../modules/products/product-embedder.ts';

/** Adapter: exposes the Ollama query-embedding call as a QueryEmbedder. */
export class OllamaQueryEmbedder implements QueryEmbedder {
  async embedQuery(query: string): Promise<number[]> {
    const embedding = await getQueryEmbedding(query);
    if (!embedding) throw new Error('Ollama returned no embedding for the search query');
    return embedding;
  }
}
