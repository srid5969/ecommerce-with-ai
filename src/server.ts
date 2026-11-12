import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { createContainer } from './container.ts';
import { closeDb } from './db/client.ts';

const container = createContainer();
const app = createApp(container);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  container.logger.info(`API running on http://localhost:${info.port}`);
});

// Graceful shutdown: stop accepting requests, then release DB connections.
const shutdown = (signal: string) => {
  container.logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
