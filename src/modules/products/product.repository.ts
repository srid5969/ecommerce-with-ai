import {
  and,
  asc,
  cosineDistance,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { Database } from '../../db/client.ts';
import { conflictChangedWhere, conflictUpdateSet } from '../../db/helpers.ts';
import { products, type NewProduct, type Product } from '../../db/schema.ts';
import { toOffset, type PageParams } from '../../lib/pagination.ts';
import type { ProductDto, ProductFilters, ProductSearchResult } from './product.types.ts';

/** Data-access contract for products. Services depend on this, not on Drizzle. */
export interface ProductRepository {
  findMany(filters: ProductFilters, page: PageParams): Promise<ProductDto[]>;
  count(filters?: ProductFilters): Promise<number>;
  findBySlug(slug: string): Promise<ProductDto | null>;
  upsertMany(rows: NewProduct[]): Promise<void>;
  countForEmbedding(options: EmbeddingSelection): Promise<number>;
  findForEmbedding(options: EmbeddingSelection & EmbeddingPage): Promise<Product[]>;
  saveEmbeddings(updates: ProductEmbeddingUpdate[]): Promise<void>;
  /** Nearest products to `embedding` by cosine similarity. */
  searchByEmbedding(embedding: number[], limit: number): Promise<ProductSearchResult[]>;
}

export interface EmbeddingSelection {
  /** true: only products never embedded or changed since; false: every product. */
  onlyStale: boolean;
}

/** Keyset pagination (by id), stable while rows are being updated. */
export interface EmbeddingPage {
  afterId?: string | undefined;
  limit: number;
}

export interface ProductEmbeddingUpdate {
  id: string;
  embedding: number[];
}

/** Columns exposed to customers (internal columns like created_at are hidden). */
const productDtoColumns = {
  id: products.id,
  sku: products.sku,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  category: products.category,
  description: products.description,
  marketingDescription: products.marketingDescription,
  imageUrl: products.defaultImageUrl,
  media: products.media,
};

function buildWhere({ category, brand }: ProductFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (category) conditions.push(eq(products.category, category));
  if (brand) conditions.push(eq(products.brand, brand));
  return conditions.length ? and(...conditions) : undefined;
}

/** Columns an import must never overwrite or compare (identity, bookkeeping, embedding job's data). */
const IMPORT_IGNORED_COLUMNS = ['id', 'createdAt', 'updatedAt', 'embedding', 'embeddedAt'] as const;

const staleEmbedding = or(isNull(products.embeddedAt), lt(products.embeddedAt, products.updatedAt));

const embeddingWhere = ({ onlyStale }: EmbeddingSelection): SQL | undefined =>
  onlyStale ? staleEmbedding : undefined;

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: Database) {}

  findMany(filters: ProductFilters, page: PageParams): Promise<ProductDto[]> {
    return this.db
      .select(productDtoColumns)
      .from(products)
      .where(buildWhere(filters))
      .orderBy(asc(products.title), asc(products.id))
      .limit(page.limit)
      .offset(toOffset(page));
  }

  async count(filters: ProductFilters = {}): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(products)
      .where(buildWhere(filters));
    return row?.total ?? 0;
  }

  async findBySlug(slug: string): Promise<ProductDto | null> {
    const [row] = await this.db
      .select(productDtoColumns)
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return row ?? null;
  }

  async upsertMany(rows: NewProduct[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db
      .insert(products)
      .values(rows)
      .onConflictDoUpdate({
        target: products.id,
        set: { ...conflictUpdateSet(products, IMPORT_IGNORED_COLUMNS), updatedAt: sql`now()` },
        // Skip rows whose data didn't change, so updated_at only moves on real changes
        // (the embedding job uses it to find stale embeddings).
        setWhere: conflictChangedWhere(products, IMPORT_IGNORED_COLUMNS),
      });
  }

  async countForEmbedding(options: EmbeddingSelection): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(products)
      .where(embeddingWhere(options));
    return row?.total ?? 0;
  }

  findForEmbedding({
    afterId,
    limit,
    ...selection
  }: EmbeddingSelection & EmbeddingPage): Promise<Product[]> {
    return this.db
      .select()
      .from(products)
      .where(and(embeddingWhere(selection), afterId ? gt(products.id, afterId) : undefined))
      .orderBy(asc(products.id))
      .limit(limit);
  }

  async saveEmbeddings(updates: ProductEmbeddingUpdate[]): Promise<void> {
    if (updates.length === 0) return;
    await this.db.transaction(async (tx) => {
      for (const { id, embedding } of updates) {
        await tx
          .update(products)
          .set({ embedding, embeddedAt: sql`now()` })
          .where(eq(products.id, id));
      }
    });
  }

  searchByEmbedding(embedding: number[], limit: number): Promise<ProductSearchResult[]> {
    const distance = cosineDistance(products.embedding, embedding);
    return this.db
      .select({ ...productDtoColumns, score: sql<number>`1 - (${distance})`.mapWith(Number) })
      .from(products)
      .where(isNotNull(products.embedding))
      .orderBy(distance)
      .limit(limit);
  }
}
