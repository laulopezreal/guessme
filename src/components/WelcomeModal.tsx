import type { GameMode } from '../services/gameMode';

interface WelcomeModalProps {
  isVisible: boolean;
  onStart: () => void;
  llmMode: boolean;
  aiAvailable: boolean;
  onSelectMode: (mode: GameMode) => void;
}

export default function WelcomeModal({ isVisible, onStart, llmMode, aiAvailable, onSelectMode }: WelcomeModalProps) {
  if (!isVisible) return null;

  return (
    <div className="modal">
      <div className="modal-content welcome-modal">
        <h2 className="modal-title">Welcome to Who Am I?</h2>

        <div className="welcome-content" tabIndex={0}>
          <p className="welcome-intro">
            Guess historic figures by learning about them through {llmMode ? 'conversation' : 'clues'}!
          </p>

          {/* A choice of modes is only offered when the server can serve AI Mode. */}
          {aiAvailable && (
            <>
              <div className="mode-toggle welcome-mode-picker" role="group" aria-label="Choose a game mode">
                <button
                  type="button"
                  className={`mode-btn ${!llmMode ? 'active' : ''}`}
                  aria-pressed={!llmMode}
                  onClick={() => onSelectMode('classic')}
                >
                  Classic Mode
                </button>
                <button
                  type="button"
                  className={`mode-btn ${llmMode ? 'active' : ''}`}
                  aria-pressed={llmMode}
                  onClick={() => onSelectMode('ai')}
                >
                  AI Mode
                </button>
              </div>
              <p className="mode-note">
                You can switch modes later from the header. Switching mid-game starts a new game.
              </p>
            </>
          )}

          {llmMode ? (
            <div className="mode-explanation">
              <h3>AI Mode</h3>
              <ul className="game-rules">
                <li>A historic figure will greet you mysteriously</li>
                <li>Ask questions to learn more about them</li>
                <li>The figure responds in character with hints</li>
                <li>You can ask up to 15 questions per conversation</li>
                <li>Start a new chat if you run out of questions</li>
                <li>When you think you know, switch to "Submit Guess" mode</li>
                <li>Fewer questions = more points!</li>
              </ul>
            </div>
          ) : (
            <div className="mode-explanation">
              <h3>{aiAvailable ? 'Classic Mode' : 'How It Works'}</h3>
              <ul className="game-rules">
                <li>Read clues about a historic figure</li>
                <li>Reveal more clues to narrow it down</li>
                <li>Submit your guess when ready</li>
                <li>Fewer clues revealed = more points!</li>
              </ul>
            </div>
          )}

          <div className="scoring-info">
            <h3>Scoring</h3>
            <p>Base score: 100 points</p>
            <p>
              {llmMode
                ? 'Each question or adaptive hint costs 5 points.'
                : 'Each extra clue beyond the first costs 10 points.'}
            </p>
            <p>Consecutive wrong guesses always subtract 5 points.</p>
            <p>Minimum score: {llmMode ? '25' : '50'} points</p>
          </div>
        </div>

        <button className="modal-btn start-btn" onClick={onStart}>
          Start Playing
        </button>
      </div>
    </div>
  );
}
