export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** One streamed piece of a model reply: reasoning ("thinking") and/or answer text. */
export interface ChatModelChunk {
  thinking?: string | undefined;
  content?: string | undefined;
}

/**
 * A streaming chat LLM. The chat service depends on this interface,
 * so the model/provider (Ollama today) can be swapped freely.
 */
export interface ChatModel {
  readonly name: string;
  stream(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<ChatModelChunk>;
}
