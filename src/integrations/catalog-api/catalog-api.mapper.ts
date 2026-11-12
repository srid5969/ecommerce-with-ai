import type { NewProduct, ProductMedia } from '../../db/schema.ts';
import type {
  CatalogMedia,
  CatalogProductDetails,
  CatalogProductSummary,
} from './catalog-api.types.ts';

/** Bundles ("predefined_combo") are not imported. */
export const isBundle = (product: CatalogProductSummary): boolean =>
  product.type === 'predefined_combo';

/** Simple products always have exactly one variant; its SKU identifies the product. */
export const getPrimarySku = (product: CatalogProductSummary): string | undefined =>
  product.variants[0]?.sku;

export const isImportable = (product: CatalogProductSummary): boolean =>
  !isBundle(product) && Boolean(getPrimarySku(product));

const blankToNull = (value: string | null | undefined): string | null =>
  value?.trim() ? value.trim() : null;

const toMedia = ({ id, url, thumbnailUrl, displayOrder }: CatalogMedia): ProductMedia => ({
  id,
  url,
  thumbnailUrl,
  displayOrder,
});

/** Maps an external product (summary + details) to our database row. */
export function toNewProduct(
  summary: CatalogProductSummary,
  details: CatalogProductDetails,
): NewProduct {
  const sku = getPrimarySku(summary);
  if (!sku) throw new Error(`Product "${summary.slug}" has no SKU`);

  return {
    id: summary.id,
    sku,
    slug: summary.slug,
    title: summary.title,
    type: summary.type,
    brand: blankToNull(summary.brand),
    category: blankToNull(summary.category),
    description: blankToNull(details.description),
    marketingDescription: details.marketingDescription,
    defaultImageUrl:
      blankToNull(details.defaultImageUrl) ??
      blankToNull(summary.defaultImageUrl) ??
      summary.media[0]?.url ??
      null,
    media: summary.media.map(toMedia),
  };
}
