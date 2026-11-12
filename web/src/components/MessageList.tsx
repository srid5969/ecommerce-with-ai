import { useEffect, useRef } from 'react';
import type { ChatTurn } from '../types/chat.ts';
import { AssistantMessage } from './AssistantMessage.tsx';

interface Props {
  turns: ChatTurn[];
  onAsk: (question: string) => void;
}

const NEAR_BOTTOM_PX = 120;

export function MessageList({ turns, onAsk }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // Follow the stream, but don't yank the page if the user scrolled up to read.
  useEffect(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    const nearBottom =
      scroller.scrollHeight - scroller.scrollTop - window.innerHeight < NEAR_BOTTOM_PX;
    const newTurn = turns.length !== lastCount.current;
    lastCount.current = turns.length;
    if (newTurn || nearBottom) endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns]);

  return (
    <div className="messages">
      {turns.map((turn, index) =>
        turn.role === 'user' ? (
          <div key={turn.id} className="message message--user">
            <p className="bubble">{turn.text}</p>
          </div>
        ) : (
          <AssistantMessage
            key={turn.id}
            turn={turn}
            isLatest={index === turns.length - 1}
            onAsk={onAsk}
          />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
