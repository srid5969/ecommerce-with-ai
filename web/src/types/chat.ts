/** Mirrors the backend contract in src/modules/chat/chat.types.ts. */

export interface ProductMedia {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  displayOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  title: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  marketingDescription: Record<string, string> | null;
  imageUrl: string | null;
  media: ProductMedia[] | null;
  /** Cosine similarity from vector search (0–1). */
  score: number;
}

export type ChatStepId = 'search' | 'found' | 'answer';

export type ChatEvent =
  | { type: 'status'; step: ChatStepId; label: string; details?: string[] }
  | { type: 'thinking'; delta: string }
  | { type: 'answer'; delta: string }
  | { type: 'products'; match: 'mentioned' | 'related'; products: Product[] }
  | { type: 'suggestions'; questions: string[] }
  | { type: 'done'; model: string; durationMs: number }
  | { type: 'error'; message: string };

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatHistoryMessage[];
}

/* ---------- UI state ---------- */

export interface ChatStep {
  id: ChatStepId;
  label: string;
  details?: string[];
}

export interface UserTurn {
  id: string;
  role: 'user';
  text: string;
}

export type AssistantStatus = 'streaming' | 'done' | 'stopped' | 'error';

export interface AssistantTurn {
  id: string;
  role: 'assistant';
  status: AssistantStatus;
  startedAt: number;
  steps: ChatStep[];
  thinking: string;
  /** ms from start until the first answer token (how long it "thought"). */
  thinkingMs?: number;
  answer: string;
  products: Product[];
  productMatch?: 'mentioned' | 'related';
  suggestions: string[];
  error?: string;
  model?: string;
  durationMs?: number;
}

export type ChatTurn = UserTurn | AssistantTurn;
