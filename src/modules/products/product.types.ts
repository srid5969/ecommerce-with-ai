import type { ProductMedia } from '../../db/schema.ts';

/** Public (customer-facing) representation of a product. */
export interface ProductDto {
  id: string;
  sku: string;
  slug: string;
  title: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  marketingDescription: Record<string, string> | null;
  imageUrl: string | null;
  media: ProductMedia[] | null;
}

export interface ProductFilters {
  category?: string | undefined;
  brand?: string | undefined;
}

/** A product returned by semantic search, with cosine similarity (1 = identical). */
export interface ProductSearchResult extends ProductDto {
  score: number;
}
