import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Message } from '../types';

interface DailyAskPanelProps {
  figureName: string;
  /** How the figure is addressed in short copy, e.g. "Marie". */
  shortName: string;
  messages: Message[];
  /** Questions answered so far today. */
  used: number;
  limit: number;
  isTyping: boolean;
  /** False once the server reports AI is unavailable: the transcript stays, the input goes. */
  available: boolean;
  onAsk: (question: string) => void;
}

const MAX_QUESTION_LENGTH = 200;

export default function DailyAskPanel({
  figureName,
  shortName,
  messages,
  used,
  limit,
  isTyping,
  available,
  onAsk,
}: DailyAskPanelProps) {
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const remaining = Math.max(0, limit - used);
  const exhausted = remaining === 0;
  const canAsk = available && !exhausted && !isTyping;

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, isTyping]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canAsk) return;
    const question = draft.trim();
    if (!question) {
      setProblem('Type a question first.');
      return;
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      setProblem(`Please keep questions under ${MAX_QUESTION_LENGTH} characters.`);
      return;
    }
    setProblem('');
    setDraft('');
    onAsk(question);
  };

  return (
    <section className="daily-ask" aria-label={`Ask ${figureName}`}>
      <div className="daily-ask-header">
        <h3 className="daily-ask-title">Ask {shortName} anything</h3>
        <span className="question-count">
          Questions left: {remaining} / {limit}
        </span>
      </div>
      <p className="daily-ask-intro">
        {used > 0 && messages.length === 0
          ? `You have asked ${used} of ${limit} questions today.`
          : `${figureName} answers as themselves now that you know who they are.`}
      </p>

      <div className="messages-container daily-ask-messages" ref={listRef} aria-live="polite">
        {messages.map(message =>
          message.role === 'system' ? (
            <p key={message.id} className="inline-warning daily-ask-error">
              {message.content}
            </p>
          ) : (
            <div key={message.id} className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}>
              <div className="message-content">{message.content}</div>
            </div>
          ),
        )}
        {isTyping && (
          <div className="message message-assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {exhausted ? (
        <p className="inline-warning warning-critical daily-ask-limit" role="status">
          That's your three questions for today's figure. Come back tomorrow for a new one.
        </p>
      ) : (
        <form className="daily-ask-form" onSubmit={submit}>
          <input
            type="text"
            className="guess-input"
            placeholder={`Ask about ${shortName}'s life, work or times...`}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            disabled={!canAsk}
            autoComplete="off"
            aria-label={`Your question for ${figureName}`}
          />
          <button type="submit" className="submit-btn" disabled={!canAsk}>
            Ask
          </button>
        </form>
      )}
      {problem && (
        <p className="daily-result-notice" role="alert">
          {problem}
        </p>
      )}
    </section>
  );
}
