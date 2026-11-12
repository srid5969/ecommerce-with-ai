import { cleanText } from '../products/product-text.ts';
import type { ProductSearchService } from '../products/product-search.service.ts';
import type { ProductSearchResult } from '../products/product.types.ts';
import type { ChatModel } from './chat-model.ts';
import { buildChatMessages } from './chat.prompt.ts';
import type { ChatEvent } from './chat.types.ts';
import type { ChatRequest } from './chat.validation.ts';
import { FollowUpExtractor } from './follow-up-extractor.ts';

export interface ChatServiceOptions {
  /** How many products vector search hands to the model. */
  candidateLimit: number;
}

const normalize = (text: string) => cleanText(text).toLowerCase();

/**
 * Products the answer refers to, in the order it mentions them.
 * Prefers **bold** titles (what the prompt asks for) so "Indomie Chicken" isn't
 * matched inside "Indomie Chicken Pepper Soup"; falls back to plain mentions.
 */
function findMentioned(products: ProductSearchResult[], answer: string): ProductSearchResult[] {
  const text = normalize(answer);
  const locate = (wrap: (title: string) => string) =>
    products
      .map((product) => ({ product, position: text.indexOf(wrap(normalize(product.title))) }))
      .filter(({ position }) => position >= 0)
      .sort((a, b) => a.position - b.position)
      .map(({ product }) => product);

  const bold = locate((title) => `**${title}**`);
  return bold.length ? bold : locate((title) => title);
}

/** Used when the model doesn't provide follow-up questions. */
function fallbackFollowUps(products: ProductSearchResult[]): string[] {
  const [top] = products;
  if (!top)
    return [
      'What drinks do you have?',
      'Show me some snacks',
      'What personal care products do you have?',
    ];
  return [
    `Tell me more about ${cleanText(top.title)}`,
    'Do you have similar products from other brands?',
    `What else do you have in ${top.category ?? 'this category'}?`,
  ];
}

/**
 * Use case: answer a customer question with retrieval-augmented generation (RAG).
 * 1. vector-search the catalog  2. let the LLM answer from those products
 * 3. return the products it chose + follow-up questions.
 * Streams every step as ChatEvents so the UI can show the assistant's "thinking".
 */
export class ChatService {
  constructor(
    private readonly productSearch: ProductSearchService,
    private readonly model: ChatModel,
    private readonly options: ChatServiceOptions = { candidateLimit: 8 },
  ) {}

  async *reply(request: ChatRequest, signal?: AbortSignal): AsyncGenerator<ChatEvent> {
    const startedAt = Date.now();

    yield {
      type: 'status',
      step: 'search',
      label: `Searching the catalog for “${request.message}”`,
    };
    const candidates = await this.productSearch.search(
      request.message,
      this.options.candidateLimit,
    );

    yield {
      type: 'status',
      step: 'found',
      label: `Found ${candidates.length} candidate products`,
      details: candidates.map(
        (p) => `${cleanText(p.title)} · ${(p.score * 100).toFixed(0)}% match`,
      ),
    };

    yield {
      type: 'status',
      step: 'answer',
      label: 'Reading product details and writing an answer',
    };
    const followUps = new FollowUpExtractor();
    let answer = '';
    for await (const chunk of this.model.stream(buildChatMessages(request, candidates), signal)) {
      if (chunk.thinking) yield { type: 'thinking', delta: chunk.thinking };
      const visible = chunk.content ? followUps.push(chunk.content) : '';
      if (visible) {
        answer += visible;
        yield { type: 'answer', delta: visible };
      }
    }
    const rest = followUps.flush();
    if (rest) {
      answer += rest;
      yield { type: 'answer', delta: rest };
    }

    const mentioned = findMentioned(candidates, answer);
    yield mentioned.length
      ? { type: 'products', match: 'mentioned', products: mentioned }
      : { type: 'products', match: 'related', products: candidates };

    const questions = followUps.questions();
    yield {
      type: 'suggestions',
      questions: questions.length
        ? questions
        : fallbackFollowUps(mentioned.length ? mentioned : candidates),
    };

    yield { type: 'done', model: this.model.name, durationMs: Date.now() - startedAt };
  }
}
