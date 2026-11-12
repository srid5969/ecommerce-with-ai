import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatSeconds } from '../lib/format.ts';
import type { AssistantTurn } from '../types/chat.ts';
import { AlertIcon, SparkIcon } from './icons.tsx';
import { ProductCard } from './ProductCard.tsx';
import { ThinkingPanel } from './ThinkingPanel.tsx';

interface Props {
  turn: AssistantTurn;
  isLatest: boolean;
  onAsk: (question: string) => void;
}

export function AssistantMessage({ turn, isLatest, onAsk }: Props) {
  const streamingAnswer = turn.status === 'streaming' && Boolean(turn.answer);

  return (
    <div className="message message--assistant">
      <span className="avatar">
        <SparkIcon />
      </span>
      <div className="message__content">
        <ThinkingPanel turn={turn} />

        {turn.answer && (
          <div className={`answer ${streamingAnswer ? 'answer--streaming' : ''}`}>
            <Markdown remarkPlugins={[remarkGfm]}>{turn.answer}</Markdown>
          </div>
        )}

        {turn.products.length > 0 && (
          <section className="products" aria-label="Products">
            <h3 className="section-title">
              {turn.productMatch === 'related'
                ? 'Related products'
                : `Products (${turn.products.length})`}
            </h3>
            <div className="products__grid">
              {turn.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {turn.status === 'error' && (
          <p className="notice notice--error">
            <AlertIcon /> {turn.error ?? 'Something went wrong.'}
          </p>
        )}
        {turn.status === 'stopped' && <p className="notice">Stopped.</p>}

        {isLatest && turn.status === 'done' && turn.suggestions.length > 0 && (
          <div className="followups">
            <p className="section-title">You could also ask</p>
            <div className="chips">
              {turn.suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="chip"
                  onClick={() => onAsk(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {turn.status === 'done' && turn.durationMs !== undefined && (
          <p className="message__footer">
            {turn.model} · {formatSeconds(turn.durationMs)}
          </p>
        )}
      </div>
    </div>
  );
}
