import { Hono } from 'hono';
import { validate } from '../../lib/validation.ts';
import type { ProductService } from './product.service.ts';
import { listProductsQuerySchema, productSlugParamSchema } from './product.validation.ts';

/** HTTP layer (controller): parse/validate input, call the service, return JSON. */
export const createProductRoutes = (service: ProductService) =>
  new Hono()
    // GET /api/products?page=1&limit=20&category=Snacks&brand=Pringles
    .get('/', validate('query', listProductsQuerySchema), async (c) =>
      c.json(await service.list(c.req.valid('query'))),
    )
    // GET /api/products/:slug
    .get('/:slug', validate('param', productSlugParamSchema), async (c) =>
      c.json(await service.getBySlug(c.req.valid('param').slug)),
    );
