import { useState } from 'react';
import type { GameMode } from '../services/gameMode';

interface WelcomeModalProps {
  isVisible: boolean;
  onStart: () => void;
  onStartDaily: () => void;
  /** Today's puzzle number, shown on the Daily choice. */
  dailyNumber: number;
  /** True once today's puzzle is finished: the Daily choice then opens the result. */
  dailyPlayed: boolean;
  /** True when an unfinished round from earlier today is waiting to be resumed. */
  dailyInProgress: boolean;
  llmMode: boolean;
  aiAvailable: boolean;
  onSelectMode: (mode: GameMode) => void;
}

export default function WelcomeModal({
  isVisible,
  onStart,
  onStartDaily,
  dailyNumber,
  dailyPlayed,
  dailyInProgress,
  llmMode,
  aiAvailable,
  onSelectMode,
}: WelcomeModalProps) {
  // The daily puzzle leads until today's is done; after that the practice modes take over.
  const [dailySelected, setDailySelected] = useState(!dailyPlayed);

  if (!isVisible) return null;

  const choosePractice = (mode: GameMode) => {
    setDailySelected(false);
    onSelectMode(mode);
  };

  const classicActive = !dailySelected && !llmMode;
  const aiActive = !dailySelected && llmMode;

  return (
    <div className="modal">
      <div className="modal-content welcome-modal">
        <h2 className="modal-title">Welcome to Who Am I?</h2>

        <div className="welcome-content">
          <p className="welcome-intro">
            Guess historic figures by learning about them through clues or conversation!
          </p>

          <div className="mode-toggle welcome-mode-picker" role="group" aria-label="Choose a game">
            <button
              type="button"
              className={`mode-btn ${dailySelected ? 'active' : ''}`}
              aria-pressed={dailySelected}
              onClick={() => setDailySelected(true)}
            >
              Daily
            </button>
            <button
              type="button"
              className={`mode-btn ${classicActive ? 'active' : ''}`}
              aria-pressed={classicActive}
              onClick={() => choosePractice('classic')}
            >
              Classic
            </button>
            <button
              type="button"
              className={`mode-btn ${aiActive ? 'active' : ''}`}
              aria-pressed={aiActive}
              disabled={!aiAvailable}
              title={aiAvailable ? undefined : 'AI mode is unavailable right now'}
              onClick={() => choosePractice('ai')}
            >
              AI
            </button>
          </div>
          <p className="mode-note">
            {dailySelected
              ? 'One figure a day, the same for everyone. Classic and AI are endless practice.'
              : aiAvailable
                ? 'You can switch modes later from the header. Switching mid-game starts a new game.'
                : 'AI mode is unavailable right now, so Classic mode is selected.'}
          </p>

          {dailySelected ? (
            <div className="mode-explanation">
              <h3>Daily puzzle #{dailyNumber}</h3>
              <ul className="game-rules">
                <li>Everyone gets the same figure today; a new one arrives at midnight UTC</li>
                <li>Classic rules: read the clues, reveal more if you need them, guess when you know</li>
                <li>One attempt a day, then share your result and keep your streak going</li>
                {dailyPlayed && <li>You have finished today's puzzle: open it to see your result and the countdown</li>}
                {!dailyPlayed && dailyInProgress && <li>You left today's puzzle unfinished: pick it up where you stopped</li>}
              </ul>
            </div>
          ) : llmMode ? (
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
              <h3>Classic Mode</h3>
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
              {aiActive
                ? 'Each question or adaptive hint costs 5 points.'
                : 'Each extra clue beyond the first costs 10 points.'}
            </p>
            <p>Consecutive wrong guesses always subtract 5 points.</p>
            <p>Minimum score: {aiActive ? '25' : '50'} points</p>
          </div>
        </div>

        <button className="modal-btn start-btn" onClick={dailySelected ? onStartDaily : onStart}>
          {dailySelected
            ? dailyPlayed
              ? "See today's result"
              : dailyInProgress
                ? "Resume today's puzzle"
                : "Play today's puzzle"
            : 'Start Playing'}
        </button>
      </div>
    </div>
  );
}
