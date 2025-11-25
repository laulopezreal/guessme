interface FeedbackMessageProps {
  message: string;
  type: 'success' | 'error' | '';
  adaptiveHintNotice?: string;
}

export default function FeedbackMessage({ message, type, adaptiveHintNotice }: FeedbackMessageProps) {
  if (!message && !adaptiveHintNotice) return null;

  return (
    <div className="feedback-wrapper">
      {message && (
        <div className={`feedback-message ${type}`}>
          {message}
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
