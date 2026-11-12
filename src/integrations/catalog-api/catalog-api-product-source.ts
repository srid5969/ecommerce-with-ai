import { mapWithConcurrency } from '../../lib/concurrency.ts';
import type { ProductBatch, ProductSource } from '../../modules/products/product-source.ts';
import type { CatalogApiClient } from './catalog-api.client.ts';
import { isImportable, toNewProduct } from './catalog-api.mapper.ts';

export interface CatalogApiProductSourceOptions {
  /** Parallel `/:slug` detail requests per page. */
  detailsConcurrency: number;
}

/**
 * Adapter: exposes the external catalog API as a generic ProductSource.
 * Handles pagination, skips bundles, enriches each product with its details.
 */
export class CatalogApiProductSource implements ProductSource {
  readonly name = 'catalog-api';

  constructor(
    private readonly client: CatalogApiClient,
    private readonly options: CatalogApiProductSourceOptions = { detailsConcurrency: 5 },
  ) {}

  async *fetchBatches(): AsyncGenerator<ProductBatch> {
    for await (const page of this.client.iterateProductPages()) {
      const importable = page.items.filter(isImportable);
      const products = await mapWithConcurrency(
        importable,
        this.options.detailsConcurrency,
        async (summary) => toNewProduct(summary, await this.client.getProductDetails(summary.slug)),
      );

      yield {
        products,
        skipped: page.items.length - importable.length,
        progress: { current: page.meta.page, total: page.meta.lastPage },
      };
    }
  }
}
