import { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface ConversationViewProps {
  messages: Message[];
  isTyping: boolean;
}

export default function ConversationView({ messages, isTyping }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Filter out system messages (only show user and assistant)
  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <div className="conversation-section">
      <h2 className="conversation-title">Conversation</h2>
      <div className="messages-container">
        {visibleMessages.length === 0 ? (
          <div className="empty-state">
            <p>Ask a question to start the conversation!</p>
          </div>
        ) : (
          visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
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
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
