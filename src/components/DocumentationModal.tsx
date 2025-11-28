interface DocumentationModalProps {
  isVisible: boolean;
  onClose: () => void;
  llmMode: boolean;
}

export default function DocumentationModal({ isVisible, onClose, llmMode }: DocumentationModalProps) {
  if (!isVisible) return null;

  return (
    <div className="modal">
      <div className="modal-content docs-modal">
        <h2 className="modal-title">How to Play</h2>
        
        <div className="docs-content">
          <section className="docs-section">
            <h3>Game Objective</h3>
            <p>
              Guess the identity of historic figures by gathering clues through conversation (AI Mode) 
              or by revealing static hints (Classic Mode).
            </p>
          </section>

          {llmMode ? (
            <>
              <section className="docs-section">
                <h3>AI Mode</h3>
                <p><strong>How it works:</strong></p>
                <ul className="docs-list">
                  <li>A historic figure greets you in character</li>
                  <li>Ask questions to learn more about them</li>
                  <li>The AI responds as that person, giving hints without revealing their name</li>
                  <li>You have 15 questions per conversation—restart the chat if you need more</li>
                  <li>Toggle to "Submit Guess" mode when ready</li>
                </ul>
                <p><strong>Tips:</strong></p>
                <ul className="docs-list">
                  <li>Start with broad questions (era, field of work)</li>
                  <li>Ask about specific achievements or events</li>
                  <li>The AI gets more specific as you ask more questions</li>
                  <li>Fewer questions = higher score!</li>
                </ul>
              </section>

              <section className="docs-section">
                <h3>Scoring (AI Mode)</h3>
                <p>Start with <strong>100 points</strong> per round.</p>
                <ul className="docs-list">
                  <li>Each question/adaptive hint: <strong>-5 points</strong></li>
                  <li>Each consecutive wrong guess: <strong>-5 points</strong></li>
                </ul>
                <p>
                  Rounds can't go below <strong>25 points</strong>, so keep hints and misses low for the best score.
                  The header shows the base points and every penalty applied for the last round.
                </p>
                <p>Question cap: <strong>15 per chat</strong> before you must restart.</p>
              </section>
            </>
          ) : (
            <>
              <section className="docs-section">
                <h3>Classic Mode</h3>
                <p><strong>How it works:</strong></p>
                <ul className="docs-list">
                  <li>Read the first clue about a historic figure</li>
                  <li>Click "Reveal Next Clue" for more information</li>
                  <li>Clues progress from vague to specific</li>
                  <li>Submit your guess when ready</li>
                </ul>
                <p><strong>Tips:</strong></p>
                <ul className="docs-list">
                  <li>Try to guess with fewer clues for more points</li>
                  <li>Clue 1 is most vague, Clue 5 is most obvious</li>
                  <li>You can guess at any time</li>
                </ul>
              </section>

              <section className="docs-section">
                <h3>Scoring (Classic Mode)</h3>
                <p>Start with <strong>100 points</strong> per round.</p>
                <ul className="docs-list">
                  <li>Every extra clue beyond the first: <strong>-10 points</strong></li>
                  <li>Each consecutive wrong guess: <strong>-5 points</strong></li>
                </ul>
                <p>
                  Rounds can't go below <strong>50 points</strong>, so guess confidently and use clues wisely.
                  The header shows the base points and every penalty applied for the last round.
                </p>
              </section>
            </>
          )}

          <section className="docs-section">
            <h3>Submitting Guesses</h3>
            <ul className="docs-list">
              <li>Enter the person's full name or last name</li>
              <li>Spelling variations are usually accepted</li>
              <li>In AI mode, the AI validates guesses intelligently</li>
              <li>Consecutive wrong guesses subtract a few points, so adjust your approach if you're stuck.</li>
            </ul>
          </section>

          <section className="docs-section">
            <h3>Game Modes</h3>
            <p>
              The game mode (AI or Classic) is configured via environment variables before starting.
              To switch modes, update your <code>.env.local</code> file and restart the dev server.
            </p>
          </section>

          <section className="docs-section">
            <h3>Current Figures</h3>
            <p>The game includes 5 historic figures:</p>
            <ul className="docs-list">
              <li>Scientists and inventors</li>
              <li>Artists and writers</li>
              <li>Leaders and pioneers</li>
            </ul>
            <p className="docs-note">
              More figures coming soon! The game shuffles them randomly each time you play.
            </p>
          </section>
        </div>

        <button className="modal-btn" onClick={onClose}>
          Got It
        </button>
      </div>
    </div>
  );
}
