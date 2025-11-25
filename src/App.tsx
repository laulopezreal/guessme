import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CharacterSilhouette from './components/CharacterSilhouette';
import CluesList from './components/CluesList';
import GuessInput from './components/GuessInput';
import FeedbackMessage from './components/FeedbackMessage';
import GameOverModal from './components/GameOverModal';
import ConversationView from './components/ConversationView';
import WelcomeModal from './components/WelcomeModal';
import DocumentationModal from './components/DocumentationModal';
import { getEnabledFigures } from './data/figuresConfig';
import { calculatePoints, shuffleArray, selectNextClue, llmScoreWeights } from './utils/gameUtils';
import { isLLMConfigured, getInitialGreeting, sendMessage, validateGuess } from './services/llmService';
import type { Clue, HistoricFigure, Message } from './types';
import './App.css';

const MISS_THRESHOLD = 2;
const QUESTION_LIMIT = 15;
const WARNING_THRESHOLD = 3;

function App() {
  const [shuffledFigures, setShuffledFigures] = useState<HistoricFigure[]>([]);
  const [currentFigureIndex, setCurrentFigureIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState<Array<Clue & { isAdaptive?: boolean }>>([]);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameEnded, setGameEnded] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [personaLine, setPersonaLine] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);
  const [adaptiveHintNotice, setAdaptiveHintNotice] = useState('');
  
  // LLM mode state
  const [llmMode, setLlmMode] = useState(isLLMConfigured());
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [outOfQuestions, setOutOfQuestions] = useState(false);

  // Current figure
  const currentFigure = shuffledFigures[currentFigureIndex];

  // Initialize conversation with AI greeting
  const initializeConversation = useCallback(async (figure: HistoricFigure) => {
    if (!llmMode) return;
    
    setIsTyping(true);
    try {
      const greeting = await getInitialGreeting(figure);
      const greetingMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
      setMessages([greetingMessage]);
    } catch (error) {
      console.error('Failed to get initial greeting:', error);
      setFeedbackMessage('AI mode failed. Switching to classic mode.');
      setFeedbackType('error');
      setLlmMode(false);
    } finally {
      setIsTyping(false);
    }
  }, [llmMode]);

  // Initialize game
  const initializeGame = useCallback(() => {
    const enabledFigures = getEnabledFigures();
    const shuffled = shuffleArray(enabledFigures);
    setShuffledFigures(shuffled);
    setCurrentFigureIndex(0);
    setRevealedClues([]);
    setConsecutiveMisses(0);
    setScore(0);
    setRound(1);
    setGameEnded(false);
    setFeedbackMessage('');
    setFeedbackType('');
    setIsRevealed(false);
    setInputDisabled(false);
    setShowNextButton(false);
    setPersonaLine('');
    setMessages([]);
    setQuestionsAsked(0);
    setAdaptiveHintNotice('');
    setOutOfQuestions(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Initialize conversation when figure changes in LLM mode
  useEffect(() => {
    if (llmMode && currentFigure && messages.length === 0) {
      initializeConversation(currentFigure);
    }
  }, [llmMode, currentFigure, messages.length, initializeConversation]);

  // Reveal the first clue when a new figure loads
  useEffect(() => {
    if (!currentFigure) return;

    const initialClue = currentFigure.clues[0];
    setRevealedClues(initialClue ? [{ ...initialClue }] : []);
    setConsecutiveMisses(0);
    setAdaptiveHintNotice('');
  }, [currentFigure]);

  const revealNextClue = useCallback((misses = consecutiveMisses) => {
    if (!currentFigure) return;

    const { nextClue, adaptive } = selectNextClue(currentFigure, revealedClues, misses, MISS_THRESHOLD);

    if (!nextClue || revealedClues.some(clue => clue.text === nextClue.text)) return;

    setRevealedClues(prev => [...prev, { ...nextClue, isAdaptive: adaptive }]);

    if (adaptive) {
      setAdaptiveHintNotice('An adaptive hint was provided after repeated misses. Future points will factor this in.');
    }
  }, [consecutiveMisses, currentFigure, revealedClues]);

  // Handle asking a question (LLM mode)
  const handleAskQuestion = useCallback(async (question: string) => {
    if (!currentFigure || !llmMode) return;

    if (questionsAsked >= QUESTION_LIMIT) {
      setFeedbackMessage("You're out of questions for this round. Start a new conversation or submit your best guess!");
      setFeedbackType('error');
      setOutOfQuestions(true);
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };

    const nextQuestionCount = questionsAsked + 1;

    setMessages(prev => [...prev, userMessage]);
    setQuestionsAsked(nextQuestionCount);
    if (nextQuestionCount >= QUESTION_LIMIT) {
      setOutOfQuestions(true);
    }
    setIsTyping(true);

    // Update hint level based on questions asked
    const newHintLevel = Math.min(5, Math.floor(nextQuestionCount / 2) + 1);

    try {
      const conversationHistory = [...messages, userMessage].filter(m => m.role !== 'system');
      const response = await sendMessage(conversationHistory, currentFigure, newHintLevel);

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setFeedbackMessage('Failed to get AI response. Try again.');
      setFeedbackType('error');
    } finally {
      setIsTyping(false);
    }
  }, [currentFigure, llmMode, messages, questionsAsked]);

  // Check guess
  const handleGuess = useCallback(async (guess: string) => {
    if (!currentFigure) return;

    // Helper function for handling incorrect guesses
    const handleIncorrectGuess = (feedbackMsg: string) => {
      setFeedbackMessage(feedbackMsg);
      setFeedbackType('error');
      const misses = consecutiveMisses + 1;
      setConsecutiveMisses(misses);
      if (misses >= MISS_THRESHOLD) {
        revealNextClue(misses);
      }
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 500);
    };

    // LLM mode: use AI validation
    if (llmMode) {
      setIsTyping(true);
      try {
        const result = await validateGuess(guess, currentFigure, messages);

        if (result.isCorrect) {
          // Correct guess
          const breakdown = calculatePoints(
            {
              cluesUsed: 1,
              adaptiveHintsUsed: questionsAsked,
              consecutiveMisses,
            },
            llmScoreWeights
          );
          setScore(prev => prev + breakdown.total);
          setFeedbackMessage(
            `${result.feedback} You earned ${breakdown.total} points!`
          );
          setFeedbackType('success');
          setPersonaLine(currentFigure.voiceLine ?? '');
          setIsRevealed(true);
          setInputDisabled(true);
          setShowNextButton(true);
          setConsecutiveMisses(0);
          setAdaptiveHintNotice('');
        } else {
          handleIncorrectGuess(result.feedback);
        }
      } catch (error) {
        console.error('Validation error:', error);
        setFeedbackMessage('Validation failed. Try again.');
        setFeedbackType('error');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Classic mode: simple string matching
    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswers = [
      currentFigure.name.toLowerCase(),
      ...currentFigure.alternateNames.map(name => name.toLowerCase())
    ];

    const isCorrect = correctAnswers.some(answer => normalizedGuess === answer);

    if (isCorrect) {
      // Correct guess
      const breakdown = calculatePoints({
        cluesUsed: revealedClues.length,
        adaptiveHintsUsed: 0,
        consecutiveMisses,
      });
      setScore(prev => prev + breakdown.total);
      setFeedbackMessage(
        `Correct! It's ${currentFigure.name}! You earned ${breakdown.total} points!`
      );
      setFeedbackType('success');
      setPersonaLine(currentFigure.voiceLine ?? '');
      setIsRevealed(true);
      setInputDisabled(true);
      setShowNextButton(true);
      setConsecutiveMisses(0);
      setAdaptiveHintNotice('');
      setOutOfQuestions(false);
    } else {
      handleIncorrectGuess('Not quite! Try again or reveal more clues.');
    }
  }, [
    consecutiveMisses,
    currentFigure,
    llmMode,
    messages,
    questionsAsked,
    revealedClues.length,
    revealNextClue,
    round,
  ]);

  // Next figure
  const nextFigure = useCallback(() => {
    const nextIndex = currentFigureIndex + 1;
    
    if (nextIndex >= shuffledFigures.length) {
      setGameEnded(true);
    } else {
      setCurrentFigureIndex(nextIndex);
      setRound(prev => prev + 1);
      setFeedbackMessage('');
      setFeedbackType('');
      setPersonaLine('');
      setIsRevealed(false);
      setInputDisabled(false);
      setShowNextButton(false);
      setMessages([]);
      setQuestionsAsked(0);
      setRevealedClues([]);
      setConsecutiveMisses(0);
      setAdaptiveHintNotice('');
      setOutOfQuestions(false);
    }
  }, [currentFigureIndex, shuffledFigures.length]);

  // Toggle between classic and LLM mode
  const handleModeToggle = useCallback(() => {
    if (isLLMConfigured()) {
      setLlmMode(prev => !prev);
    } else {
      setFeedbackMessage('Please configure your API key in .env.local to use AI mode.');
      setFeedbackType('error');
    }
  }, []);

  // Restart game
  const restartGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // Start game (from welcome modal)
  const handleStartGame = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // Show/hide documentation
  const handleShowDocs = useCallback(() => {
    setShowDocs(true);
  }, []);

  const handleCloseDocs = useCallback(() => {
    setShowDocs(false);
  }, []);

  const resetConversation = useCallback(() => {
    if (!currentFigure || !llmMode) return;
    setMessages([]);
    setQuestionsAsked(0);
    setFeedbackMessage('');
    setFeedbackType('');
    setOutOfQuestions(false);
    initializeConversation(currentFigure);
  }, [currentFigure, initializeConversation, llmMode]);

  if (!currentFigure) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-container">
      <Header
        llmMode={llmMode}
        onToggleMode={handleModeToggle}
        onShowDocs={handleShowDocs}
        disabled={inputDisabled}
      />
      
      <div className="character-and-score">
        <CharacterSilhouette revealed={isRevealed} eraTags={currentFigure.eraTags} />
        <div className="score-board">
          <div className="score-item">
            <span className="score-label">Round</span>
            <span className="score-value">{round}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
        </div>
      </div>
      
      <main className="game-main">
        
        {llmMode ? (
          <ConversationView 
            messages={messages} 
            isTyping={isTyping}
            remainingQuestions={Math.max(0, QUESTION_LIMIT - questionsAsked)}
            questionLimit={QUESTION_LIMIT}
            warningThreshold={WARNING_THRESHOLD}
            onResetConversation={resetConversation}
          />
        ) : (
          <CluesList
            revealedClues={revealedClues}
            totalClues={currentFigure.clues.length}
            onRevealNextClue={revealNextClue}
            disabled={inputDisabled}
          />
        )}

        <GuessInput
          onSubmitGuess={handleGuess}
          onAskQuestion={llmMode ? handleAskQuestion : undefined}
          disabled={inputDisabled || isTyping}
          triggerShake={triggerShake}
          llmMode={llmMode}
          onValidationError={(message) => {
            setFeedbackMessage(message);
            setFeedbackType('error');
          }}
          questionLimitReached={llmMode ? outOfQuestions : false}
        />

        <FeedbackMessage
          message={feedbackMessage}
          type={feedbackType}
          adaptiveHintNotice={adaptiveHintNotice}
          personaLine={personaLine}
        />

        {showNextButton && (
          <button className="next-btn" onClick={nextFigure}>
            Next Character
          </button>
        )}
      </main>

      <WelcomeModal
        isVisible={showWelcome}
        onStart={handleStartGame}
        llmMode={llmMode}
      />

      <DocumentationModal
        isVisible={showDocs}
        onClose={handleCloseDocs}
        llmMode={llmMode}
      />

      <GameOverModal
        isVisible={gameEnded}
        finalScore={score}
        onRestart={restartGame}
      />
    </div>
  );
}

export default App;
