import { BagIcon, PlusIcon } from './icons.tsx';

interface Props {
  canReset: boolean;
  onReset: () => void;
}

export function ChatHeader({ canReset, onReset }: Props) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo">
          <BagIcon />
        </span>
        <div>
          <h1 className="header__title">Product Assistant</h1>
          <p className="header__subtitle">Ask anything about our catalog</p>
        </div>
      </div>
      {canReset && (
        <button type="button" className="button button--ghost" onClick={onReset}>
          <PlusIcon /> New chat
        </button>
      )}
    </header>
  );
}
