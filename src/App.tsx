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
import { shuffleArray, calculatePoints } from './utils/gameUtils';
import { isLLMConfigured, getInitialGreeting, sendMessage, validateGuess } from './services/llmService';
import type { HistoricFigure, Message } from './types';
import './App.css';

function App() {
  const [shuffledFigures, setShuffledFigures] = useState<HistoricFigure[]>([]);
  const [currentFigureIndex, setCurrentFigureIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameEnded, setGameEnded] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);
  
  // LLM mode state
  const [llmMode, setLlmMode] = useState(isLLMConfigured());
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDocs, setShowDocs] = useState(false);

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
    setCurrentClueIndex(1); // Start with first clue revealed
    setScore(0);
    setRound(1);
    setGameEnded(false);
    setFeedbackMessage('');
    setFeedbackType('');
    setIsRevealed(false);
    setInputDisabled(false);
    setShowNextButton(false);
    setMessages([]);
    setQuestionsAsked(0);
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

  // Reveal next clue
  const revealNextClue = useCallback(() => {
    if (currentFigure && currentClueIndex < currentFigure.clues.length) {
      setCurrentClueIndex(prev => prev + 1);
    }
  }, [currentFigure, currentClueIndex]);

  // Handle asking a question (LLM mode)
  const handleAskQuestion = useCallback(async (question: string) => {
    if (!currentFigure || !llmMode) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestionsAsked(prev => prev + 1);
    setIsTyping(true);

    // Update hint level based on questions asked
    const newHintLevel = Math.min(5, Math.floor(questionsAsked / 2) + 1);

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

    // LLM mode: use AI validation
    if (llmMode) {
      setIsTyping(true);
      try {
        const result = await validateGuess(guess, currentFigure, messages);

        if (result.isCorrect) {
          // Correct guess
          const points = Math.max(25, 100 - (questionsAsked * 5));
          setScore(prev => prev + points);
          setFeedbackMessage(`${result.feedback} You earned ${points} points!`);
          setFeedbackType('success');
          setIsRevealed(true);
          setInputDisabled(true);
          setShowNextButton(true);
        } else {
          // Incorrect guess
          setFeedbackMessage(result.feedback);
          setFeedbackType('error');
          setTriggerShake(true);
          setTimeout(() => setTriggerShake(false), 500);
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
      const points = calculatePoints(currentClueIndex);
      setScore(prev => prev + points);
      setFeedbackMessage(`Correct! It's ${currentFigure.name}! You earned ${points} points!`);
      setFeedbackType('success');
      setIsRevealed(true);
      setInputDisabled(true);
      setShowNextButton(true);
    } else {
      // Incorrect guess
      setFeedbackMessage('Not quite! Try again or reveal more clues.');
      setFeedbackType('error');
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 500);
    }
  }, [currentFigure, currentClueIndex, llmMode, messages, questionsAsked]);

  // Next figure
  const nextFigure = useCallback(() => {
    const nextIndex = currentFigureIndex + 1;
    
    if (nextIndex >= shuffledFigures.length) {
      setGameEnded(true);
    } else {
      setCurrentFigureIndex(nextIndex);
      setCurrentClueIndex(1); // Auto-reveal first clue
      setRound(prev => prev + 1);
      setFeedbackMessage('');
      setFeedbackType('');
      setIsRevealed(false);
      setInputDisabled(false);
      setShowNextButton(false);
      setMessages([]);
      setQuestionsAsked(0);
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

  if (!currentFigure) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-container">
      <Header 
        score={score} 
        round={round} 
        llmMode={llmMode}
        onToggleMode={handleModeToggle}
        onShowDocs={handleShowDocs}
        disabled={inputDisabled}
      />
      
      <main className="game-main">
        <CharacterSilhouette revealed={isRevealed} />
        
        {llmMode ? (
          <ConversationView 
            messages={messages} 
            isTyping={isTyping}
          />
        ) : (
          <CluesList
            clues={currentFigure.clues}
            currentClueIndex={currentClueIndex}
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
        />

        <FeedbackMessage message={feedbackMessage} type={feedbackType} />

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
