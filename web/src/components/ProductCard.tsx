import { useState } from 'react';
import { cleanText, productImage, toHighlights } from '../lib/product.ts';
import type { Product } from '../types/chat.ts';
import { BagIcon } from './icons.tsx';

export function ProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const image = productImage(product);
  const description = cleanText(product.description);
  const highlights = toHighlights(product);

  return (
    <article className="product">
      <div className="product__media">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={cleanText(product.title)}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <BagIcon width={32} height={32} />
        )}
        <span className="product__score" title="Similarity to your question (vector search)">
          {Math.round(product.score * 100)}% match
        </span>
      </div>

      <div className="product__body">
        {product.brand && <p className="product__brand">{product.brand}</p>}
        <h3 className="product__title">{cleanText(product.title)}</h3>

        {highlights.length > 0 && (
          <ul className="product__highlights">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {description && (
          <>
            <p
              className={`product__description ${expanded ? '' : 'product__description--clamped'}`}
            >
              {description}
            </p>
            {description.length > 140 && (
              <button type="button" className="link" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </>
        )}

        <div className="product__meta">
          {product.category && <span className="tag">{product.category}</span>}
          <span className="product__sku">SKU {product.sku}</span>
        </div>
      </div>
    </article>
  );
}
