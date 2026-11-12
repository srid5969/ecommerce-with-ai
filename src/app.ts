import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger as requestLogger } from 'hono/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Container } from './container.ts';
import { AppError } from './lib/errors.ts';
import { createChatRoutes } from './modules/chat/chat.routes.ts';
import { createProductRoutes } from './modules/products/product.routes.ts';

/** Builds the HTTP app (no `listen` here, so it can be tested in isolation). */
export function createApp({ productService, chatService, logger }: Container) {
  const app = new Hono();

  app.use('*', requestLogger());
  app.use('/api/*', cors());

  app.get('/health', (c) => c.json({ ok: true }));
  app.route('/api/products', createProductRoutes(productService));
  app.route('/api/chat', createChatRoutes(chatService, logger));

  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));

  app.onError((err, c) => {
    if (err instanceof AppError) {
      const { code, message, details } = err;
      return c.json({ error: { code, message, details } }, err.status as ContentfulStatusCode);
    }
    if (err instanceof HTTPException) return err.getResponse();

    logger.error('Unhandled error', err);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
  });

  return app;
}
