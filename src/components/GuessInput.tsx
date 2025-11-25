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

  // Escape a string for use in a RegExp constructor to avoid accidental
  // interpretation of special characters coming from the list entries.
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");

  // Heuristic to detect when the user is probably making a guess instead of
  // asking a question while in AI mode.
  const isLikelyGuess = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return false;

    // Anything ending with a question mark is treated as a question.
    if (trimmed.endsWith('?')) return false;

    const lower = trimmed.toLowerCase();

    // Common guess-intent phrases.
    const guessPhrases = [
      "i think it's",
      "i think its",
      'my guess is',
      "i'm guessing",
      'could it be',
      "it's ",
      'its ',
      'maybe it is',
      "maybe it's",
      'maybe its',
    ];
    if (guessPhrases.some(phrase => lower.startsWith(phrase) || lower.includes(` ${phrase}`))) {
      return true;
    }

    const words = trimmed.split(/\s+/);

    // Single word (likely a name) – treat as guess.
    if (words.length === 1) {
      return true;
    }

    // Short phrase with 2–3 words and minimal punctuation is also likely a name.
    if (words.length <= 3 && !/[.,!?]/.test(trimmed)) {
      return true;
    }

    return false;
  };

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

    // Build a safe regex from the profanity list by escaping entries and
    // using a non-capturing group. Word boundaries are preserved to avoid
    // matching substrings inside harmless words.
    const profanityRegex = new RegExp(`\\b(?:${PROFANITY_LIST.map(escapeRegExp).join('|')})\\b`, 'i');
    if (profanityRegex.test(trimmed)) {
      onValidationError?.('Please keep questions family-friendly.');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    const value = input.trim();
    if (!value) {
      onValidationError?.('Please enter a question or guess before submitting.');
      return;
    }

    if (llmMode && isQuestionMode) {
      const lower = value.toLowerCase();
      const greetings = ['hello', 'welcome', 'hi', 'hey', 'greetings', 'thanks', 'thank you', 'please'];
      
      // Check if it's a greeting and show a playful message
      if (greetings.some(greeting => lower === greeting || lower.startsWith(greeting + ' '))) {
        onValidationError?.(
          '👋 Nice to meet you! But we\'re here to play, not chat. Ask a smart question or make your guess to win! 😎'
        );
        return;
      }

      // Autodetect guesses while the UI is in "Ask Question" mode.
      if (isLikelyGuess(value)) {
        onValidationError?.(
          'This looks like a guess. To submit it as your answer (which will affect your score), switch to "Submit Guess" mode and send it again.'
        );
        // Keep the input so the user can resend it, but highlight that they
        // should explicitly switch modes before it counts as a guess.
        setIsQuestionMode(false);
        return;
      }

      if (questionLimitReached) {
        onValidationError?.('You have reached the question limit for this round.');
        return;
      }
      if (!onAskQuestion) return;
      if (!validateQuestion()) return;
      onAskQuestion(value);
      setInput('');
      return;
    }

    // Classic mode or explicit guess mode.
    onSubmitGuess(value);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        onKeyDown={handleKeyDown}
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
