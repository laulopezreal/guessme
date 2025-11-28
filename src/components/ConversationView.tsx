import type { Message } from '../types';

interface ConversationViewProps {
  messages: Message[];
  isTyping: boolean;
  remainingQuestions: number;
  questionLimit: number;
  warningThreshold: number;
  onResetConversation: () => void;
  canResetConversation?: boolean;
}

export default function ConversationView({
  messages,
  isTyping,
  remainingQuestions,
  questionLimit,
  warningThreshold,
  onResetConversation,
  canResetConversation = true,
}: ConversationViewProps) {
  // Show all messages including system messages
  const visibleMessages = messages;
  const nearLimit = remainingQuestions <= warningThreshold;
  const outOfQuestions = remainingQuestions <= 0;

  return (
    <div className="conversation-section">
      <div className="conversation-header">
        <h2 className="conversation-title">Conversation</h2>
        <div className="question-meter">
          <span className="question-count">
            Questions left: {remainingQuestions} / {questionLimit}
          </span>
          <button
            className="reset-btn"
            onClick={onResetConversation}
            disabled={!canResetConversation}
          >
            New Conversation
          </button>
        </div>
      </div>

      {nearLimit && (
        <div className={`inline-warning ${outOfQuestions ? 'warning-critical' : ''}`}>
          {outOfQuestions
            ? 'You are out of questions for this chat. Start a new conversation or submit your best guess.'
            : `You are nearing the question limit for this chat. ${remainingQuestions} question${remainingQuestions === 1 ? '' : 's'} left before you need to start a new conversation.`}
        </div>
      )}

      <div className="messages-container">
        {visibleMessages.length === 0 ? (
          <div className="empty-state">
            <p>Ask a question to start the conversation!</p>
          </div>
        ) : (
          visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.role === 'system' 
                  ? 'message-system' 
                  : message.role === 'user'
                    ? 'message-user'
                    : 'message-assistant'
              }`}
            >
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))
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
    </div>
  );
}
