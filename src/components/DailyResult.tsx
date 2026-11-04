import { useEffect, useState } from 'react';
import { buildDailyShareText, dailyResultGrid, formatCountdown, msUntilNextUtcDay } from '../utils/gameUtils';
import type { ShareMethod } from '../types';

interface DailyResultProps {
  dayNumber: number;
  won: boolean;
  cluesUsed: number;
  totalClues: number;
  score: number;
  /** The address printed in the shared text so readers can find the game. */
  siteUrl: string;
  onShare: (method: ShareMethod) => void;
  onShowStats: () => void;
  onPractice: () => void;
  /** Called when the countdown ends and the next puzzle is available. */
  onPlayNext: () => void;
}

const hasWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export default function DailyResult({
  dayNumber,
  won,
  cluesUsed,
  totalClues,
  score,
  siteUrl,
  onShare,
  onShowStats,
  onPractice,
  onPlayNext,
}: DailyResultProps) {
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  // Tick once a second so the countdown to the next puzzle stays live.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shareText = buildDailyShareText({ dayNumber, won, cluesUsed, totalClues, score, url: siteUrl });
  const headline = shareText.split('\n')[0];
  const remaining = msUntilNextUtcDay(new Date(now));
  const nextReady = remaining === 0;

  const copyToClipboard = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareText);
      setShowFallback(false);
      setNotice('Copied to clipboard!');
      onShare('clipboard');
    } catch {
      // Clipboard access can be refused (insecure context, permissions): let the player copy by hand.
      setShowFallback(true);
      setNotice('Copying is blocked here. Select the text below and copy it yourself.');
      onShare('manual');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ text: shareText });
      setNotice('Shared!');
      onShare('share');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // the player closed the share sheet
      await copyToClipboard();
    }
  };

  const clueWord = cluesUsed === 1 ? 'clue' : 'clues';

  return (
    <section className="daily-result" aria-label="Daily puzzle result">
      <h2 className="daily-result-title">{won ? `Solved in ${cluesUsed} ${clueWord}` : 'Not this time'}</h2>
      <p className="daily-result-meta">{headline}</p>
      <p
        className="daily-result-grid"
        aria-label={`${cluesUsed} of ${totalClues} clues revealed, ${won ? 'solved' : 'gave up'}, ${score} points`}
      >
        <span className="daily-result-squares">{dailyResultGrid(cluesUsed, totalClues, won)}</span>{' '}
        <span className="daily-result-points">{score} pts</span>
      </p>
      <p className="daily-result-url">{siteUrl}</p>

      <div className="daily-result-actions">
        {hasWebShare && (
          <button type="button" className="modal-btn daily-action" onClick={share}>
            Share
          </button>
        )}
        <button
          type="button"
          className={`modal-btn daily-action ${hasWebShare ? 'modal-btn-secondary' : ''}`}
          onClick={copyToClipboard}
        >
          Copy result
        </button>
        <button type="button" className="modal-btn modal-btn-secondary daily-action" onClick={onShowStats}>
          Stats
        </button>
      </div>

      {notice && (
        <p className="daily-result-notice" role="status">
          {notice}
        </p>
      )}
      {showFallback && (
        <textarea
          className="daily-share-fallback"
          readOnly
          value={shareText}
          rows={3}
          aria-label="Result to copy"
          onFocus={event => event.currentTarget.select()}
        />
      )}

      <div className="daily-countdown">
        {nextReady ? (
          <>
            <span>Puzzle #{dayNumber + 1} is ready.</span>
            <button type="button" className="modal-btn daily-action" onClick={onPlayNext}>
              Play it now
            </button>
          </>
        ) : (
          <span>
            Next puzzle in <time className="daily-countdown-time">{formatCountdown(remaining)}</time>
          </span>
        )}
        <button type="button" className="modal-btn modal-btn-secondary daily-action" onClick={onPractice}>
          Keep practising
        </button>
      </div>
    </section>
  );
}
