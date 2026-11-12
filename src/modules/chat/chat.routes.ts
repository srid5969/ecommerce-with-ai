import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Logger } from '../../lib/logger.ts';
import { validate } from '../../lib/validation.ts';
import type { ChatService } from './chat.service.ts';
import type { ChatEvent } from './chat.types.ts';
import { chatRequestSchema } from './chat.validation.ts';

/** POST /api/chat → text/event-stream of ChatEvents. */
export const createChatRoutes = (service: ChatService, logger: Logger) =>
  new Hono().post('/', validate('json', chatRequestSchema), (c) => {
    const request = c.req.valid('json');

    return streamSSE(c, async (stream) => {
      const send = (event: ChatEvent) =>
        stream.writeSSE({ event: event.type, data: JSON.stringify(event) });

      // Stop generating when the client disconnects / presses "stop".
      const abort = new AbortController();
      stream.onAbort(() => abort.abort());

      try {
        for await (const event of service.reply(request, abort.signal)) {
          if (abort.signal.aborted) break;
          await send(event);
        }
      } catch (error) {
        if (abort.signal.aborted) return;
        logger.error('Chat reply failed', error);
        await send({ type: 'error', message: 'Sorry, something went wrong. Please try again.' });
      }
    });
  });
