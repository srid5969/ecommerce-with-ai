import { z } from 'zod';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

const optionalText = z.string().trim().min(1).optional();

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  category: optionalText,
  brand: optionalText,
});

export const productSlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(255),
});
