import type { NewProduct } from '../../db/schema.ts';

export interface ProductBatch {
  products: NewProduct[];
  /** Items the source received but chose not to import (e.g. bundles). */
  skipped: number;
  progress: { current: number; total: number };
}

/**
 * Abstraction over where products come from (external catalog API today, anything tomorrow).
 * The sync service depends on this interface, not on a concrete API client.
 */
export interface ProductSource {
  readonly name: string;
  fetchBatches(): AsyncIterable<ProductBatch>;
}
