import { useState, type KeyboardEvent } from 'react';

interface GuessInputProps {
  onSubmitGuess: (guess: string) => void;
  onAskQuestion?: (question: string) => void;
  disabled: boolean;
  triggerShake: boolean;
  llmMode?: boolean;
  onValidationError?: (message: string) => void;
  questionLimitReached?: boolean;
  onGiveUp?: () => void;
  canGiveUp?: boolean;
}

export default function GuessInput({
  onSubmitGuess,
  onAskQuestion,
  disabled,
  triggerShake,
  llmMode = false,
  onValidationError,
  questionLimitReached = false,
  onGiveUp,
  canGiveUp = true,
}: GuessInputProps) {
  const [input, setInput] = useState('');
  const [isQuestionMode, setIsQuestionMode] = useState(true);

  type ForcedMode = 'question' | 'guess';

  const PROFANITY_LIST = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn'];
  const MAX_QUESTION_LENGTH = 200;

  // Escape a string for use in a RegExp constructor to avoid accidental
  // interpretation of special characters coming from the list entries.
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");

  // Heuristic to detect when the user is probably making a guess instead of
  // asking a question while in AI mode.
  // Goal: only auto-detect VERY obvious "are you X"-style guesses in question
  // mode, where X is one of our known historic figures, and let everything
  // else behave like a normal question.
  const isLikelyGuess = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return false;

    const lower = trimmed.toLowerCase();

    // 1) Exclude greetings and pleasantries – let the figure handle them.
    const greetings = [
      'hello',
      'hi',
      'hey',
      'greetings',
      'welcome',
      'thanks',
      'thank you',
      'please',
      'good morning',
      'good afternoon',
      'good evening',
    ];
    const isGreeting = greetings.some((greeting) => {
      return (
        lower === greeting ||
        lower === `${greeting}!` ||
        lower === `${greeting}?` ||
        lower.startsWith(`${greeting} `)
      );
    });
    if (isGreeting) return false;

    // Known figure name tokens (lowercase) – surnames and key first names.
    const figureTokens = [
      'einstein',
      'curie',
      'tesla',
      'newton',
      'galileo',
'shakespeare','shakespear','shakspear',
      'napoleon',
      'leonardo',
      'joan',
      'elizabeth',
      'marie',
      'albert',
      'nikola',
      'isaac',
      'william',
    ];

    const containsFigureToken = (text: string): boolean => {
      const tokens = text.toLowerCase().split(/\s+/);
      return tokens.some((t) => figureTokens.includes(t));
    };

    // 2) Forward pattern: "are you X", "is it X", etc.
    const forwardMatch = /^(are you|is it|could it be|is this|were you|was it)\s+(.+)/i.exec(trimmed);
    if (forwardMatch) {
      const tail = forwardMatch[2];
      if (containsFigureToken(tail)) {
        return true;
      }
    }

    // 3) "you are X" pattern, which players often use informally.
    const youAreMatch = /^(you are|you're)\s+(.+)/i.exec(trimmed);
    if (youAreMatch) {
      const tail = youAreMatch[2];
      if (containsFigureToken(tail)) {
        return true;
      }
    }

    // 4) Reverse pattern: "Einstein are you?", "Marie Curie is it".
    const reverseMatch = /^(.+?)\s+(are you|is it)\??$/i.exec(trimmed);
    if (reverseMatch) {
      const head = reverseMatch[1];
      if (containsFigureToken(head)) {
        return true;
      }
    }

    // 5) Very explicit guess-intent phrases with something that looks like a
    // known figure name.
    const guessPhrases = [
      "i think it's",
      "i think its",
      'my guess is',
      "i'm guessing",
      'could it be',
      'maybe it is',
      "maybe it's",
      'maybe its',
    ];
    for (const phrase of guessPhrases) {
      if (lower.startsWith(phrase)) {
        const rest = lower.slice(phrase.length).trim();
        if (containsFigureToken(rest)) {
          return true;
        }
      }
    }

    // 5) Single-word guesses that directly match known surnames/short names
    // for our historic figures (e.g. "einstein", "tesla"). These are very
    // likely to be guesses rather than questions.
    const words = trimmed.split(/\s+/);
    if (words.length === 1 && figureTokens.includes(lower)) {
      return true;
    }

    // 6) Anything ending with a question mark that didn't match above is a
    // normal question.
    if (trimmed.endsWith('?')) return false;

    // 7) Fallback: do NOT auto-treat other inputs as guesses. The user can
    // always switch to "Submit Guess" mode explicitly.
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

  const handleSubmit = (forcedMode?: ForcedMode) => {
    const value = input.trim();
    if (!value) {
      onValidationError?.('Please enter a question or guess before submitting.');
      return;
    }

    const treatAsQuestion =
      llmMode && (forcedMode === 'question' || (!forcedMode && isQuestionMode));

    if (treatAsQuestion) {
      // Autodetect guesses only when submission wasn't explicitly forced.
      if (!forcedMode && isLikelyGuess(value)) {
        // Auto-submit as a guess - this feels more natural than forcing mode switch
        onSubmitGuess(value);
        setInput('');
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

  const handleAskClick = () => {
    if (disabled || (llmMode && questionLimitReached)) return;
    setIsQuestionMode(true);
    // Let the normal submission path run, so auto guess detection still applies
    handleSubmit();
  };

  const handleGuessClick = () => {
    if (disabled) return;
    setIsQuestionMode(false);
    // Explicitly force this as a guess submission
    handleSubmit('guess');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Enter should behave like clicking the currently active mode button.
      // In question mode, it goes through auto-detection; in guess mode,
      // it behaves like an explicit guess.
      if (llmMode && !isQuestionMode) {
        handleSubmit('guess');
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="guess-section">
      {llmMode && (
        <div className="mode-toggle">
          <button
            className={`mode-btn ${isQuestionMode ? 'active' : ''}`}
            onClick={handleAskClick}
            disabled={disabled || questionLimitReached}
          >
            Ask Question
          </button>
          <button
            className={`mode-btn ${!isQuestionMode ? 'active' : ''}`}
            onClick={handleGuessClick}
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
      {!llmMode && (
        <button 
          className="submit-btn" 
          onClick={() => handleSubmit('guess')}
          disabled={disabled}
        >
          Submit Guess
        </button>
      )}
      {onGiveUp && canGiveUp && (
        <button
          type="button"
          className="give-up-btn"
          onClick={onGiveUp}
        >
          Give Up
        </button>
      )}
    </div>
  );
}
