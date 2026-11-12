import type { ChatEvent, ChatRequest } from '../types/chat.ts';
import { readSse } from './sse.ts';

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

/** POST /api/chat and yield each streamed ChatEvent. */
export async function* streamChat(
  request: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok || !response.body) throw new Error(await errorMessage(response));

  for await (const { data } of readSse(response.body)) {
    yield JSON.parse(data) as ChatEvent;
  }
}
