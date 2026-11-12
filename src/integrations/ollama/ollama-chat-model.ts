import type { Ollama } from 'ollama';
import type { ChatMessage, ChatModel, ChatModelChunk } from '../../modules/chat/chat-model.ts';

export interface OllamaChatModelOptions {
  /** Stream the model's reasoning ("thinking") before the answer. */
  think: boolean;
  /** Context window in tokens (Ollama's default is often too small for RAG + reasoning). */
  contextTokens: number;
}

/** Adapter: Ollama streaming chat (optionally with reasoning/"thinking") as a ChatModel. */
export class OllamaChatModel implements ChatModel {
  constructor(
    private readonly client: Ollama,
    readonly name: string,
    private readonly options: OllamaChatModelOptions,
  ) {}

  async *stream(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<ChatModelChunk> {
    const response = await this.client.chat({
      model: this.name,
      messages,
      stream: true,
      think: this.options.think,
      options: { num_ctx: this.options.contextTokens },
    });
    const abort = () => response.abort();
    signal?.addEventListener('abort', abort, { once: true });

    try {
      for await (const part of response) {
        yield { thinking: part.message.thinking, content: part.message.content };
      }
    } catch (error) {
      if (!signal?.aborted) throw error; // aborting makes the iterator throw; that's expected
    } finally {
      signal?.removeEventListener('abort', abort);
    }
  }
}
