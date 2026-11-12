import { useCallback, useEffect, useReducer, useRef } from 'react';
import { streamChat } from '../api/chat-client.ts';
import type { ChatHistoryMessage, ChatTurn } from '../types/chat.ts';
import { chatReducer } from './chat-reducer.ts';

/** Completed turns → the history the backend uses for follow-up questions. */
function toHistory(turns: ChatTurn[]): ChatHistoryMessage[] {
  return turns.flatMap((turn): ChatHistoryMessage[] => {
    if (turn.role === 'user') return [{ role: 'user', content: turn.text }];
    return turn.answer ? [{ role: 'assistant', content: turn.answer }] : [];
  });
}

export function useChat() {
  const [turns, dispatch] = useReducer(chatReducer, []);
  const turnsRef = useRef(turns);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const last = turns.at(-1);
  const isStreaming = last?.role === 'assistant' && last.status === 'streaming';

  const send = useCallback(async (input: string) => {
    const text = input.trim();
    if (!text || abortRef.current) return;

    const history = toHistory(turnsRef.current);
    const assistantId = crypto.randomUUID();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: 'send', userId: crypto.randomUUID(), assistantId, text, at: Date.now() });

    try {
      for await (const event of streamChat({ message: text, history }, controller.signal)) {
        dispatch({ type: 'event', id: assistantId, event, at: Date.now() });
      }
      dispatch({ type: 'finish', id: assistantId, status: 'done' });
    } catch (error) {
      if (controller.signal.aborted) {
        dispatch({ type: 'finish', id: assistantId, status: 'stopped' });
      } else {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        dispatch({ type: 'finish', id: assistantId, status: 'error', error: message });
      }
    } finally {
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'reset' });
  }, []);

  return { turns, isStreaming, send, stop, reset };
}
