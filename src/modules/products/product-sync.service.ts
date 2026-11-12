import type { Logger } from '../../lib/logger.ts';
import type { ProductSource } from './product-source.ts';
import type { ProductRepository } from './product.repository.ts';

export interface SyncResult {
  saved: number;
  skipped: number;
  totalInDb: number;
}

/** Use case: pull every product from a source and upsert it into our database. */
export class ProductSyncService {
  constructor(
    private readonly source: ProductSource,
    private readonly repository: ProductRepository,
    private readonly logger: Logger,
  ) {}

  async run(): Promise<SyncResult> {
    let saved = 0;
    let skipped = 0;

    for await (const batch of this.source.fetchBatches()) {
      await this.repository.upsertMany(batch.products);
      saved += batch.products.length;
      skipped += batch.skipped;
      this.logger.info(
        `[${this.source.name}] page ${batch.progress.current}/${batch.progress.total}: ` +
          `saved ${batch.products.length}, skipped ${batch.skipped}`,
      );
    }

    return { saved, skipped, totalInDb: await this.repository.count() };
  }
}
