/**
 * Composition root: the only place that wires concrete implementations together
 * (dependency injection by hand — no framework needed).
 */
import { env } from './config/env.ts';
import { db } from './db/client.ts';
import { CatalogApiClient } from './integrations/catalog-api/catalog-api.client.ts';
import { CatalogApiProductSource } from './integrations/catalog-api/catalog-api-product-source.ts';
import { OllamaChatModel } from './integrations/ollama/ollama-chat-model.ts';
import { ollamaClient } from './integrations/ollama/ollama-client.ts';
import { OllamaProductEmbedder } from './integrations/ollama/ollama-product-embedder.ts';
import { OllamaQueryEmbedder } from './integrations/ollama/ollama-query-embedder.ts';
import { logger } from './lib/logger.ts';
import { ChatService } from './modules/chat/chat.service.ts';
import { ProductEmbeddingService } from './modules/products/product-embedding.service.ts';
import { ProductSearchService } from './modules/products/product-search.service.ts';
import { ProductSyncService } from './modules/products/product-sync.service.ts';
import { DrizzleProductRepository } from './modules/products/product.repository.ts';
import { ProductService } from './modules/products/product.service.ts';

export function createContainer() {
  const productRepository = new DrizzleProductRepository(db);
  const productService = new ProductService(productRepository);

  const productSource = new CatalogApiProductSource(new CatalogApiClient(env.CATALOG_API_URL));
  const productSyncService = new ProductSyncService(productSource, productRepository, logger);

  const productEmbeddingService = new ProductEmbeddingService(
    productRepository,
    new OllamaProductEmbedder(),
    logger,
  );

  const productSearchService = new ProductSearchService(
    productRepository,
    new OllamaQueryEmbedder(),
  );
  const chatService = new ChatService(
    productSearchService,
    new OllamaChatModel(ollamaClient, env.CHAT_MODEL, {
      think: env.CHAT_THINK,
      contextTokens: env.CHAT_CONTEXT_TOKENS,
    }),
  );

  return {
    logger,
    productRepository,
    productService,
    productSyncService,
    productEmbeddingService,
    productSearchService,
    chatService,
  };
}

export type Container = ReturnType<typeof createContainer>;
