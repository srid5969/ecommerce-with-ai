import { fetchJson } from '../../lib/http-client.ts';
import {
  catalogDetailsResponseSchema,
  catalogProductPageSchema,
  type CatalogProductDetails,
  type CatalogProductPage,
} from './catalog-api.types.ts';

/**
 * Gateway to the external catalog (PIM) API. Knows URLs and response envelopes, nothing else.
 */
export class CatalogApiClient {
  /** The API ignores larger page sizes. */
  static readonly MAX_PAGE_SIZE = 50;

  constructor(
    private readonly baseUrl: string,
    private readonly pageSize = CatalogApiClient.MAX_PAGE_SIZE,
  ) {}

  getProductPage(page: number): Promise<CatalogProductPage> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(this.pageSize));
    return fetchJson(url.toString(), catalogProductPageSchema);
  }

  async getProductDetails(slug: string): Promise<CatalogProductDetails> {
    const url = `${this.baseUrl}/${encodeURIComponent(slug)}`;
    const response = await fetchJson(url, catalogDetailsResponseSchema);
    return response.data;
  }

  /** Iterates every page of the paginated product list. */
  async *iterateProductPages(): AsyncGenerator<CatalogProductPage> {
    for (let page = 1, lastPage = 1; page <= lastPage; page++) {
      const result = await this.getProductPage(page);
      lastPage = result.meta.lastPage;
      yield result;
    }
  }
}
