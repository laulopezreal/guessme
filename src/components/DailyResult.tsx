import { useEffect, useState } from 'react';
import DailyAskPanel from './DailyAskPanel';
import { buildDailyShareText, dailyResultGrid, figureShortName, formatCountdown, msUntilNextUtcDay } from '../utils/gameUtils';
import type { Message, ShareMethod } from '../types';

/** The post-reveal chat with today's figure, offered while the server can serve AI. */
interface DailyAskControls {
  figureName: string;
  available: boolean;
  messages: Message[];
  used: number;
  limit: number;
  isTyping: boolean;
  onAsk: (question: string) => void;
  /** Called when the player opens the chat. */
  onOpen: () => void;
}

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
  ask: DailyAskControls;
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
  ask,
}: DailyResultProps) {
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

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
  const shortName = figureShortName(ask.figureName);

  const openAsk = () => {
    setAskOpen(true);
    ask.onOpen();
  };

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

      {/* The chat is only offered while the server can serve AI; once open it stays, input and all, until AI goes away. */}
      {ask.available && !askOpen && (
        <button type="button" className="modal-btn daily-action daily-ask-open" onClick={openAsk}>
          Ask {shortName} anything
        </button>
      )}
      {askOpen && (
        <DailyAskPanel
          figureName={ask.figureName}
          shortName={shortName}
          messages={ask.messages}
          used={ask.used}
          limit={ask.limit}
          isTyping={ask.isTyping}
          available={ask.available}
          onAsk={ask.onAsk}
        />
      )}

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
