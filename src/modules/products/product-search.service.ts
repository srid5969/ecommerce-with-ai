import type { QueryEmbedder } from './product-embedder.ts';
import type { ProductRepository } from './product.repository.ts';
import type { ProductSearchResult } from './product.types.ts';

/** Use case: semantic (vector) search over the product catalog. */
export class ProductSearchService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly embedder: QueryEmbedder,
  ) {}

  async search(query: string, limit: number): Promise<ProductSearchResult[]> {
    const embedding = await this.embedder.embedQuery(query);
    return this.repository.searchByEmbedding(embedding, limit);
  }
}
