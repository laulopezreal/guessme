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

    const { cluesUsed, adaptiveHintsUsed, consecutiveMisses } = lastRoundBreakdown;
    const formatPenalty = (label: string, count: number, penalty: number) => {
      if (penalty === 0) return `${label} 0`;
      const pluralizedLabel = count === 1 ? label : `${label}s`;
      return `${label} (${count} ${pluralizedLabel}) ${penalty}`;
    };

    return (
      <div className="score-item">
        <span className="score-label">
          Last Round{lastRoundNumber ? ` (Round ${lastRoundNumber})` : ''}
        </span>
        <span className="score-value">
          {`${lastRoundBreakdown.basePoints} - ${formatPenalty('clue', cluesUsed, lastRoundBreakdown.cluePenalty)} - ${formatPenalty('hint', adaptiveHintsUsed, lastRoundBreakdown.hintPenalty)} - ${formatPenalty('miss', consecutiveMisses, lastRoundBreakdown.wrongGuessPenalty)} = ${lastRoundBreakdown.total}`}
        </span>
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
      <div className="score-board">
        <div className="score-item">
          <span className="score-label">Round</span>
          <span className="score-value">{round}</span>
        </div>
        <div className="score-item">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        {renderBreakdown()}
      </div>
    </header>
  );
}
