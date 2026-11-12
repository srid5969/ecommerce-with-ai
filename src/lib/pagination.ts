export interface PageParams {
  page: number;
  limit: number;
}

export interface PageMeta extends PageParams {
  total: number;
  lastPage: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export const toOffset = ({ page, limit }: PageParams): number => (page - 1) * limit;

export function buildPageMeta(total: number, { page, limit }: PageParams): PageMeta {
  return { total, page, limit, lastPage: Math.max(1, Math.ceil(total / limit)) };
}
