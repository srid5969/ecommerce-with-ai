import { ChatHeader } from './components/ChatHeader.tsx';
import { Composer } from './components/Composer.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { MessageList } from './components/MessageList.tsx';
import { useChat } from './hooks/useChat.ts';

export function App() {
  const { turns, isStreaming, send, stop, reset } = useChat();
  const ask = (question: string) => void send(question);

  return (
    <div className="app">
      <ChatHeader canReset={turns.length > 0} onReset={reset} />
      <main className="main">
        {turns.length === 0 ? (
          <EmptyState onPick={ask} />
        ) : (
          <MessageList turns={turns} onAsk={ask} />
        )}
      </main>
      <footer className="footer">
        <Composer isStreaming={isStreaming} onSend={ask} onStop={stop} />
        <p className="footer__note">
          Answers come only from our catalog. Prices and stock aren't shown here.
        </p>
      </footer>
    </div>
  );
}
