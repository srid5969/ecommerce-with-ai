/**
 * Seeds the products table from the external catalog API.
 * Usage: pnpm seed   (idempotent — safe to re-run)
 */
import { createContainer } from '../container.ts';
import { closeDb } from '../db/client.ts';

const { productSyncService, logger } = createContainer();

try {
  const { saved, skipped, totalInDb } = await productSyncService.run();
  logger.info(`Seed complete: saved ${saved}, skipped ${skipped} bundles, ${totalInDb} rows in DB`);
} catch (error) {
  logger.error('Seed failed', error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
