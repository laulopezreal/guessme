import type { Clue } from '../types';

interface CluesListProps {
  revealedClues: Array<Clue & { isAdaptive?: boolean }>;
  totalClues: number;
  onRevealNextClue: () => void;
  disabled: boolean;
}

export default function CluesList({
  revealedClues,
  totalClues,
  onRevealNextClue,
  disabled
}: CluesListProps) {
  const allCluesRevealed = revealedClues.length >= totalClues;

  return (
    <div className="clues-section">
      <h2 className="clues-title">Clues</h2>
      <div className="clues-container">
        {revealedClues.map((clue, index) => (
          <div key={clue.text} className={`clue-item ${clue.isAdaptive ? 'adaptive-clue' : ''}`}>
            <div className="clue-header">
              <span className="clue-number">{index + 1}</span>
              <span className={`clue-difficulty ${clue.difficulty}`}>{clue.difficulty}</span>
              {clue.isAdaptive && <span className="clue-adaptive-badge">Adaptive hint</span>}
            </div>
            <span className="clue-text">{clue.text}</span>
          </div>
        ))}
      </div>
      <button
        className="reveal-btn"
        onClick={onRevealNextClue}
        disabled={disabled || allCluesRevealed}
      >
        {allCluesRevealed ? 'All clues revealed!' : 'Reveal Next Clue'}
      </button>
    </div>
  );
}
