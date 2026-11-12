import { useEffect, useRef, useState } from 'react';
import { formatSeconds } from '../lib/format.ts';
import type { AssistantTurn } from '../types/chat.ts';
import { CheckIcon, ChevronIcon } from './icons.tsx';
import { Spinner } from './Spinner.tsx';

function useElapsed(startedAt: number, running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  return now - startedAt;
}

/** Collapsible "what the assistant is thinking": pipeline steps + the model's reasoning stream. */
export function ThinkingPanel({ turn }: { turn: AssistantTurn }) {
  const isThinking = turn.status === 'streaming' && !turn.answer;
  const elapsed = useElapsed(turn.startedAt, isThinking);
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? isThinking; // open while thinking, auto-collapse once the answer starts
  const reasoningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = reasoningRef.current;
    if (el && isThinking) el.scrollTop = el.scrollHeight;
  }, [turn.thinking, isThinking]);

  if (turn.steps.length === 0 && !turn.thinking) {
    return turn.status === 'streaming' ? (
      <div className="thinking__summary thinking__summary--static">
        <Spinner /> Getting started…
      </div>
    ) : null;
  }

  const summary = isThinking
    ? `Thinking… ${formatSeconds(elapsed)}`
    : `Thought for ${formatSeconds(turn.thinkingMs ?? elapsed)}`;

  return (
    <div className={`thinking ${open ? 'thinking--open' : ''}`}>
      <button
        type="button"
        className="thinking__summary"
        aria-expanded={open}
        onClick={() => setUserOpen(!open)}
      >
        {isThinking ? <Spinner /> : <ChevronIcon className="thinking__chevron" />}
        <span>{summary}</span>
      </button>

      {open && (
        <div className="thinking__body">
          <ol className="steps">
            {turn.steps.map((step, index) => {
              const active =
                turn.status === 'streaming' && index === turn.steps.length - 1 && !turn.answer;
              return (
                <li key={step.id} className="step">
                  <span className="step__icon">{active ? <Spinner /> : <CheckIcon />}</span>
                  <div>
                    <p className="step__label">{step.label}</p>
                    {step.details && step.details.length > 0 && (
                      <ul className="step__details">
                        {step.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {turn.thinking && (
            <div className="reasoning" ref={reasoningRef}>
              <p className="reasoning__title">Model reasoning</p>
              <p className="reasoning__text">{turn.thinking.trim()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
