import { useState, type KeyboardEvent } from 'react';

interface GuessInputProps {
  onSubmitGuess: (guess: string) => void;
  onAskQuestion?: (question: string) => void;
  disabled: boolean;
  triggerShake: boolean;
  llmMode?: boolean;
  onValidationError?: (message: string) => void;
  questionLimitReached?: boolean;
}

export default function GuessInput({
  onSubmitGuess,
  onAskQuestion,
  disabled,
  triggerShake,
  llmMode = false,
  onValidationError,
  questionLimitReached = false,
}: GuessInputProps) {
  const [input, setInput] = useState('');
  const [isQuestionMode, setIsQuestionMode] = useState(true);

  const PROFANITY_LIST = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn'];
  const MAX_QUESTION_LENGTH = 200;

  const validateQuestion = (): boolean => {
    const trimmed = input.trim();

    if (!trimmed) {
      onValidationError?.('Please enter a question before asking.');
      return false;
    }

    if (trimmed.length > MAX_QUESTION_LENGTH) {
      onValidationError?.('Please keep questions under 200 characters.');
      return false;
    }

    const containsProfanity = PROFANITY_LIST.some(word => trimmed.toLowerCase().includes(word));
    if (containsProfanity) {
      onValidationError?.('Please keep questions family-friendly.');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      onValidationError?.('Please enter a question or guess before submitting.');
      return;
    }

    if (llmMode && isQuestionMode) {
      if (questionLimitReached) {
        onValidationError?.('You have reached the question limit for this round.');
        return;
      }
      if (!onAskQuestion) return;
      if (!validateQuestion()) return;
      onAskQuestion(input.trim());
    } else {
      onSubmitGuess(input.trim());
    }
    setInput('');
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
            disabled={disabled || questionLimitReached}
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
        disabled={disabled || (llmMode && isQuestionMode && questionLimitReached)}
        autoComplete="off"
        style={triggerShake ? { animation: 'shake 0.5s' } : {}}
      />
      <button 
        className="submit-btn" 
        onClick={handleSubmit}
        disabled={disabled || (llmMode && isQuestionMode && questionLimitReached)}
      >
        {llmMode && isQuestionMode ? 'Ask' : 'Submit Guess'}
      </button>
    </div>
  );
}
