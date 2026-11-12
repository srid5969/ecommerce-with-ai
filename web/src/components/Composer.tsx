import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendIcon, StopIcon } from './icons.tsx';

interface Props {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

const MAX_LENGTH = 1000;

export function Composer({ isStreaming, onSend, onStop }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea with its content.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus();
  }, [isStreaming]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (isStreaming || !text.trim()) return;
    onSend(text);
    setText('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  };

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={inputRef}
        className="composer__input"
        rows={1}
        maxLength={MAX_LENGTH}
        placeholder="Ask about a product, brand or need…"
        aria-label="Message"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {isStreaming ? (
        <button
          type="button"
          className="icon-button icon-button--stop"
          onClick={onStop}
          aria-label="Stop"
        >
          <StopIcon />
        </button>
      ) : (
        <button type="submit" className="icon-button" disabled={!text.trim()} aria-label="Send">
          <SendIcon />
        </button>
      )}
    </form>
  );
}
