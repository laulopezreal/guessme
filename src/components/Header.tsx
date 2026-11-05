import Toggle from './Toggle';

interface HeaderProps {
  llmMode: boolean;
  aiAvailable: boolean;
  /** True while today's puzzle is open; the mode toggle is locked to Classic then. */
  isDaily: boolean;
  onShowDocs: () => void;
  onShowStats: () => void;
  /** Opens the daily puzzle from practice, or practice from the daily puzzle. */
  onSwitchKind: () => void;
  onToggleMode: () => void;
}

export default function Header({
  llmMode,
  aiAvailable,
  isDaily,
  onShowDocs,
  onShowStats,
  onSwitchKind,
  onToggleMode,
}: HeaderProps) {
  const hint = isDaily
    ? 'The daily puzzle always uses Classic rules'
    : `Switch to ${llmMode ? 'Classic' : 'AI'} mode`;

  return (
    <header className="game-header">
      <div className="navbar">
        <h1 className="game-title">Who Am I?</h1>
        <div className="navbar-controls">
          <button type="button" className="nav-btn" onClick={onSwitchKind}>
            {isDaily ? 'Practice' : 'Daily'}
          </button>
          <button type="button" className="nav-btn" onClick={onShowStats}>
            Stats
          </button>
          <button type="button" className="docs-btn" onClick={onShowDocs}>
            How to Play
          </button>
          {/* A choice of modes is only offered when the server can serve AI Mode; the daily locks it to Classic. */}
          {aiAvailable && (
            <div className="mode-toggle-wrapper" title={hint}>
              <span className="mode-label">Mode: {llmMode ? 'AI' : 'Classic'}</span>
              <Toggle
                isOn={llmMode}
                onToggle={onToggleMode}
                disabled={isDaily}
                aria-label={hint}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
