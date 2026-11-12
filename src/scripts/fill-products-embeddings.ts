/**
 * Generates embeddings for products and stores them in `products.embedding`.
 *
 * Usage:
 *   pnpm embeddings:fill           # only new/changed products (safe to re-run, resumes)
 *   pnpm embeddings:fill --force   # re-embed everything (e.g. after changing the model or text)
 */
import { parseArgs } from 'node:util';
import { createContainer } from '../container.ts';
import { closeDb } from '../db/client.ts';

const { values } = parseArgs({ options: { force: { type: 'boolean', default: false } } });
const { productEmbeddingService, logger } = createContainer();

try {
  const { embedded, total } = await productEmbeddingService.run({ force: values.force });
  logger.info(
    total === 0
      ? 'All product embeddings are up to date'
      : `Embeddings complete: ${embedded}/${total} products embedded`,
  );
} catch (error) {
  logger.error('Filling product embeddings failed', error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
