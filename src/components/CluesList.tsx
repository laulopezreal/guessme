interface CluesListProps {
  clues: string[];
  currentClueIndex: number;
  onRevealNextClue: () => void;
  disabled: boolean;
}

export default function CluesList({ 
  clues, 
  currentClueIndex, 
  onRevealNextClue, 
  disabled 
}: CluesListProps) {
  const revealedClues = clues.slice(0, currentClueIndex);
  const allCluesRevealed = currentClueIndex >= clues.length;

  return (
    <div className="clues-section">
      <h2 className="clues-title">Clues</h2>
      <div className="clues-container">
        {revealedClues.map((clue, index) => (
          <div key={index} className="clue-item">
            <span className="clue-number">{index + 1}</span>
            <span className="clue-text">{clue}</span>
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
