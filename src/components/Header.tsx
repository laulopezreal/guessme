interface HeaderProps {
  llmMode: boolean;
  onShowDocs: () => void;
}

export default function Header({
  llmMode,
  onShowDocs,
}: HeaderProps) {
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
          <div className="mode-display">
            <span className="mode-label">Mode: {llmMode ? 'AI' : 'Classic'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
