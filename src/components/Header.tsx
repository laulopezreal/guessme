import Toggle from './Toggle';
import type { ScoreBreakdown } from '../utils/gameUtils';

interface HeaderProps {
  score: number;
  round: number;
  llmMode: boolean;
  onToggleMode: () => void;
  onShowDocs: () => void;
  disabled?: boolean;
  lastRoundBreakdown?: ScoreBreakdown | null;
  lastRoundNumber?: number | null;
}

export default function Header({
  score,
  round,
  llmMode,
  onToggleMode,
  onShowDocs,
  disabled = false,
  lastRoundBreakdown,
  lastRoundNumber,
}: HeaderProps) {
  const renderBreakdown = () => {
    if (!lastRoundBreakdown) return null;

    const { cluesUsed, adaptiveHintsUsed, consecutiveMisses, minPoints } = lastRoundBreakdown;
    const breakdownItems = [
      {
        label: 'Base points',
        helper: `${lastRoundBreakdown.basePoints} starting points`,
        value: lastRoundBreakdown.basePoints,
      },
      {
        label: 'Clue penalty',
        helper: `${Math.max(0, cluesUsed - 1)} extra ${cluesUsed - 1 === 1 ? 'clue' : 'clues'} used`,
        value: -lastRoundBreakdown.cluePenalty,
      },
      {
        label: 'Hint penalty',
        helper: `${adaptiveHintsUsed} ${adaptiveHintsUsed === 1 ? 'hint' : 'hints'} asked`,
        value: -lastRoundBreakdown.hintPenalty,
      },
      {
        label: 'Miss penalty',
        helper: `${consecutiveMisses} ${consecutiveMisses === 1 ? 'miss' : 'misses'} recorded`,
        value: -lastRoundBreakdown.wrongGuessPenalty,
      },
    ];

    const minApplied = lastRoundBreakdown.total !== lastRoundBreakdown.rawTotal;

    return (
      <div className="score-item score-breakdown" aria-live="polite">
        <div className="score-breakdown-heading">
          <span className="score-label">
            Last Round{lastRoundNumber ? ` (Round ${lastRoundNumber})` : ''}
          </span>
          <span className="score-value">{lastRoundBreakdown.total}</span>
        </div>

        <div className="score-breakdown-rows" role="list" aria-label="Last round score details">
          {breakdownItems.map(item => (
            <div className="breakdown-row" role="listitem" key={item.label}>
              <div className="breakdown-label">
                <span>{item.label}</span>
                <span className="breakdown-helper">{item.helper}</span>
              </div>
              <span className="breakdown-value">
                {item.value > 0 ? `+${item.value}` : item.value}
              </span>
            </div>
          ))}

          {minApplied && (
            <div className="breakdown-row" role="listitem">
              <div className="breakdown-label">
                <span>Minimum applied</span>
                <span className="breakdown-helper">Scores can’t drop below {minPoints} points</span>
              </div>
              <span className="breakdown-value">{lastRoundBreakdown.total}</span>
            </div>
          )}

          <div className="breakdown-total" aria-label="Total points for last round">
            <span>Total</span>
            <span className="breakdown-value">{lastRoundBreakdown.total}</span>
          </div>
        </div>
      </div>
    );
  };

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
