import Toggle from './Toggle';
interface HeaderProps {
  llmMode: boolean;
  onToggleMode: () => void;
  onShowDocs: () => void;
  disabled?: boolean;
}

export default function Header({
  llmMode,
  onToggleMode,
  onShowDocs,
  disabled = false,
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
    </header>
  );
}
