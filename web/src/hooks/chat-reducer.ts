import type { AssistantStatus, AssistantTurn, ChatEvent, ChatTurn } from '../types/chat.ts';

export type ChatAction =
  | { type: 'send'; userId: string; assistantId: string; text: string; at: number }
  | { type: 'event'; id: string; event: ChatEvent; at: number }
  | { type: 'finish'; id: string; status: AssistantStatus; error?: string }
  | { type: 'reset' };

function applyEvent(turn: AssistantTurn, event: ChatEvent, at: number): AssistantTurn {
  switch (event.type) {
    case 'status':
      return {
        ...turn,
        steps: [
          ...turn.steps.filter((s) => s.id !== event.step),
          { id: event.step, label: event.label, details: event.details },
        ],
      };
    case 'thinking':
      return { ...turn, thinking: turn.thinking + event.delta };
    case 'answer':
      return {
        ...turn,
        answer: turn.answer + event.delta,
        thinkingMs: turn.thinkingMs ?? at - turn.startedAt,
      };
    case 'products':
      return { ...turn, products: event.products, productMatch: event.match };
    case 'suggestions':
      return { ...turn, suggestions: event.questions };
    case 'done':
      return { ...turn, status: 'done', model: event.model, durationMs: event.durationMs };
    case 'error':
      return { ...turn, status: 'error', error: event.message };
  }
}

const updateAssistant = (
  turns: ChatTurn[],
  id: string,
  update: (turn: AssistantTurn) => AssistantTurn,
): ChatTurn[] =>
  turns.map((turn) => (turn.id === id && turn.role === 'assistant' ? update(turn) : turn));

export function chatReducer(turns: ChatTurn[], action: ChatAction): ChatTurn[] {
  switch (action.type) {
    case 'send':
      return [
        ...turns,
        { id: action.userId, role: 'user', text: action.text },
        {
          id: action.assistantId,
          role: 'assistant',
          status: 'streaming',
          startedAt: action.at,
          steps: [],
          thinking: '',
          answer: '',
          products: [],
          suggestions: [],
        },
      ];
    case 'event':
      return updateAssistant(turns, action.id, (turn) => applyEvent(turn, action.event, action.at));
    case 'finish':
      return updateAssistant(turns, action.id, (turn) =>
        turn.status === 'streaming'
          ? { ...turn, status: action.status, ...(action.error ? { error: action.error } : {}) }
          : turn,
      );
    case 'reset':
      return [];
  }
}
