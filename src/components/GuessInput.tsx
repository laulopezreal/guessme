import { useState, type KeyboardEvent } from 'react';

interface GuessInputProps {
  onSubmitGuess: (guess: string) => void;
  onAskQuestion?: (question: string) => void;
  disabled: boolean;
  triggerShake: boolean;
  llmMode?: boolean;
}

export default function GuessInput({ 
  onSubmitGuess, 
  onAskQuestion,
  disabled, 
  triggerShake,
  llmMode = false 
}: GuessInputProps) {
  const [input, setInput] = useState('');
  const [isQuestionMode, setIsQuestionMode] = useState(true);

  const handleSubmit = () => {
    if (input.trim()) {
      if (llmMode && isQuestionMode && onAskQuestion) {
        onAskQuestion(input);
      } else {
        onSubmitGuess(input);
      }
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="guess-section">
      {llmMode && (
        <div className="mode-toggle">
          <button
            className={`mode-btn ${isQuestionMode ? 'active' : ''}`}
            onClick={() => setIsQuestionMode(true)}
            disabled={disabled}
          >
            Ask Question
          </button>
          <button
            className={`mode-btn ${!isQuestionMode ? 'active' : ''}`}
            onClick={() => setIsQuestionMode(false)}
            disabled={disabled}
          >
            Submit Guess
          </button>
        </div>
      )}
      
      <input
        type="text"
        className="guess-input"
        placeholder={
          llmMode && isQuestionMode 
            ? "Ask a question..." 
            : "Type your guess here..."
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        autoComplete="off"
        style={triggerShake ? { animation: 'shake 0.5s' } : {}}
      />
      <button 
        className="submit-btn" 
        onClick={handleSubmit}
        disabled={disabled}
      >
        {llmMode && isQuestionMode ? 'Ask' : 'Submit Guess'}
      </button>
    </div>
  );
}
