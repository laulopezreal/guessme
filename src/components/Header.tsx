import Toggle from './Toggle';

interface HeaderProps {
  llmMode: boolean;
  aiAvailable: boolean;
  onShowDocs: () => void;
  onToggleMode: () => void;
}

export default function Header({
  llmMode,
  aiAvailable,
  onShowDocs,
  onToggleMode,
}: HeaderProps) {
  const hint = `Switch to ${llmMode ? 'Classic' : 'AI'} mode`;

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
          {/* A choice of modes is only offered when the server can serve AI Mode. */}
          {aiAvailable && (
            <div className="mode-toggle-wrapper" title={hint}>
              <span className="mode-label">Mode: {llmMode ? 'AI' : 'Classic'}</span>
              <Toggle
                isOn={llmMode}
                onToggle={onToggleMode}
                aria-label={hint}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
