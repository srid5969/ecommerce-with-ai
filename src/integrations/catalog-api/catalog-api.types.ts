/**
 * Zod schemas for the external catalog API payloads (only the fields we use).
 * Responses are validated at the boundary, so the rest of the app can trust these types.
 */
import { z } from 'zod';

export const catalogMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().nullable().default(null),
  displayOrder: z.number().int(),
});

export const catalogVariantSchema = z.object({
  id: z.string(),
  sku: z.string().min(1),
  name: z.string(),
});

export const catalogProductSummarySchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  /** e.g. "simple" or "predefined_combo" (bundle); kept open so new types don't break imports. */
  type: z.string(),
  brand: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  defaultImageUrl: z.string().nullable().default(null),
  variants: z.array(catalogVariantSchema).default([]),
  media: z.array(catalogMediaSchema).default([]),
});

export const catalogProductPageSchema = z.object({
  items: z.array(catalogProductSummarySchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    lastPage: z.number().int().nonnegative(),
  }),
});

export const catalogProductDetailsSchema = z.object({
  description: z.string().nullable().default(null),
  marketingDescription: z.record(z.string(), z.string()).nullable().default(null),
  defaultImageUrl: z.string().nullable().default(null),
});

export const catalogDetailsResponseSchema = z.object({
  data: catalogProductDetailsSchema,
});

export type CatalogMedia = z.infer<typeof catalogMediaSchema>;
export type CatalogVariant = z.infer<typeof catalogVariantSchema>;
export type CatalogProductSummary = z.infer<typeof catalogProductSummarySchema>;
export type CatalogProductPage = z.infer<typeof catalogProductPageSchema>;
export type CatalogProductDetails = z.infer<typeof catalogProductDetailsSchema>;
