interface HeaderProps {
  score: number;
  round: number;
  llmMode: boolean;
  onToggleMode: () => void;
  onShowDocs: () => void;
  disabled?: boolean;
}

export default function Header({ score, round, llmMode, onToggleMode, onShowDocs, disabled = false }: HeaderProps) {
  return (
    <header className="game-header">
      <div className="navbar">
        <h1 className="game-title">Who Am I?</h1>
        <div className="navbar-controls">
          <button
            className="docs-btn"
            onClick={onShowDocs}
          >
            How to Play
          </button>
          <button
            className="mode-toggle-btn"
            onClick={onToggleMode}
            disabled={disabled}
          >
            {llmMode ? 'AI Mode' : 'Classic Mode'}
          </button>
        </div>
      </div>
      <div className="score-board">
        <div className="score-item">
          <span className="score-label">Round</span>
          <span className="score-value">{round}</span>
        </div>
        <div className="score-item">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
      </div>
    </header>
  );
}
