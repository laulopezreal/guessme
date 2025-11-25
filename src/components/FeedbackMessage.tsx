interface FeedbackMessageProps {
  message: string;
  type: 'success' | 'error' | '';
}

export default function FeedbackMessage({ message, type }: FeedbackMessageProps) {
  if (!message) return null;

  return (
    <div className={`feedback-message ${type}`}>
      {message}
    </div>
  );
}
