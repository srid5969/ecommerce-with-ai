import { NotFoundError } from '../../lib/errors.ts';
import { buildPageMeta, type PageParams, type Paginated } from '../../lib/pagination.ts';
import type { ProductRepository } from './product.repository.ts';
import type { ProductDto, ProductFilters } from './product.types.ts';

export type ListProductsInput = ProductFilters & PageParams;

/** Read-side use cases for the customer API. */
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list({ page, limit, ...filters }: ListProductsInput): Promise<Paginated<ProductDto>> {
    const pageParams = { page, limit };
    const [items, total] = await Promise.all([
      this.repository.findMany(filters, pageParams),
      this.repository.count(filters),
    ]);
    return { items, meta: buildPageMeta(total, pageParams) };
  }

  async getBySlug(slug: string): Promise<ProductDto> {
    const product = await this.repository.findBySlug(slug);
    if (!product) throw new NotFoundError('Product');
    return product;
  }
}
