import { SparkIcon } from './icons.tsx';

const STARTERS = [
  'What Indomie products do you have?',
  'Show me drinks for a party',
  'Any snacks for kids?',
  'What do you have for hair care?',
];

export function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <SparkIcon width={26} height={26} />
      </span>
      <h2 className="empty__title">What are you looking for today?</h2>
      <p className="empty__text">
        I search the catalog by meaning, not just keywords, and show you how I got to the answer.
      </p>
      <div className="chips chips--center">
        {STARTERS.map((question) => (
          <button key={question} type="button" className="chip" onClick={() => onPick(question)}>
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
