interface ModeToggleProps {
  llmMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function ModeToggle({ llmMode, onToggle, disabled = false }: ModeToggleProps) {
  return (
    <div className="mode-switch-container">
      <button
        className="mode-switch-btn"
        onClick={onToggle}
        disabled={disabled}
        title={llmMode ? "Switch to Classic Mode" : "Switch to AI Mode"}
      >
        {llmMode ? '🤖 AI Mode' : '📝 Classic Mode'}
        <span className="mode-switch-hint">
          {llmMode ? '(Click for static clues)' : '(Click for AI conversation)'}
        </span>
      </button>
    </div>
  );
}
