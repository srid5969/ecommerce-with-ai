import { EMBEDDING_DIMENSIONS, type Product } from '../../db/schema.ts';
import { mapWithConcurrency } from '../../lib/concurrency.ts';
import type { Logger } from '../../lib/logger.ts';
import type { ProductEmbedder } from './product-embedder.ts';
import type { ProductRepository } from './product.repository.ts';

export interface ProductEmbeddingOptions {
  /** Products loaded from the DB and saved per round-trip. */
  batchSize: number;
  /** Parallel embedding requests. */
  concurrency: number;
}

export interface EmbeddingRunOptions {
  /** Re-embed every product, not only new/changed ones. */
  force: boolean;
}

export interface EmbeddingRunResult {
  embedded: number;
  total: number;
}

const DEFAULT_OPTIONS: ProductEmbeddingOptions = { batchSize: 32, concurrency: 4 };

/**
 * Use case: generate embeddings for products and store them.
 * Incremental by default (only products without an embedding or updated since),
 * so it is safe to re-run and resumes where it stopped.
 */
export class ProductEmbeddingService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly embedder: ProductEmbedder,
    private readonly logger: Logger,
    private readonly options: ProductEmbeddingOptions = DEFAULT_OPTIONS,
  ) {}

  async run({ force }: EmbeddingRunOptions = { force: false }): Promise<EmbeddingRunResult> {
    const selection = { onlyStale: !force };
    const total = await this.repository.countForEmbedding(selection);
    let embedded = 0;
    let afterId: string | undefined;

    while (embedded < total) {
      const batch = await this.repository.findForEmbedding({
        ...selection,
        afterId,
        limit: this.options.batchSize,
      });
      if (batch.length === 0) break;

      const updates = await mapWithConcurrency(
        batch,
        this.options.concurrency,
        async (product) => ({
          id: product.id,
          embedding: await this.embed(product),
        }),
      );
      await this.repository.saveEmbeddings(updates);

      embedded += updates.length;
      afterId = batch.at(-1)?.id;
      this.logger.info(`embedded ${embedded}/${total}`);
    }

    return { embedded, total };
  }

  private async embed(product: Product): Promise<number[]> {
    const embedding = await this.embedder.embed(product);
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding for "${product.slug}" has ${embedding.length} dimensions, ` +
          `expected ${EMBEDDING_DIMENSIONS}. Did the embedding model change?`,
      );
    }
    return embedding;
  }
}
