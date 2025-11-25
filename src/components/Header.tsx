import Toggle from './Toggle';

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
          <div className="mode-toggle-wrapper">
            <span className="mode-label">{llmMode ? 'AI' : 'Classic'}</span>
            <Toggle 
              isOn={llmMode} 
              onToggle={onToggleMode} 
              disabled={disabled}
              aria-label={`Switch to ${llmMode ? 'Classic' : 'AI'} mode`}
            />
          </div>
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
