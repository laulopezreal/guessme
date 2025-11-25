interface FeedbackMessageProps {
  message: string;
  type: 'success' | 'error' | '';
  adaptiveHintNotice?: string;
  personaLine?: string;
}

export default function FeedbackMessage({ message, type, adaptiveHintNotice, personaLine }: FeedbackMessageProps) {
  if (!message && !adaptiveHintNotice && !personaLine) return null;

  const liveRegion = type === 'error' ? 'assertive' : 'polite';

  return (
    <div className="feedback-wrapper" aria-live={liveRegion} aria-atomic="true" role="status">
      {message && (
        <div className={`feedback-message ${type}`}>
          {message}
        </div>
      )}
      {personaLine && (
        <div className="feedback-message persona" aria-label="Character reaction">
          {personaLine}
        </div>
      )}
      {adaptiveHintNotice && (
        <div className="feedback-message info adaptive-banner">
          {adaptiveHintNotice}
        </div>
      )}
    </div>
  );
}
