import { pgTable, uuid, text, jsonb, timestamp, vector } from 'drizzle-orm/pg-core';

/** Must match the embedding model's output size (embeddinggemma = 768). Changing it needs a migration. */
export const EMBEDDING_DIMENSIONS = 768;

export interface ProductMedia {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  displayOrder: number;
}

export const products = pgTable('products', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  description: text('description'),
  marketingDescription: jsonb('marketing_description').$type<Record<string, string>>(),
  type: text('type'),
  brand: text('brand'),
  category: text('category'),
  defaultImageUrl: text('default_image_url'),
  media: jsonb('media').$type<ProductMedia[]>(),
  embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }),
  /** When `embedding` was last generated; compared with `updatedAt` to find stale embeddings. */
  embeddedAt: timestamp('embedded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
