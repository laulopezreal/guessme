import { useState } from 'react';
import Header from './components/Header';
import CharacterSilhouette from './components/CharacterSilhouette';
import CluesList from './components/CluesList';
import GuessInput from './components/GuessInput';
import FeedbackMessage from './components/FeedbackMessage';
import GameOverModal from './components/GameOverModal';
import ConversationView from './components/ConversationView';
import WelcomeModal from './components/WelcomeModal';
import DocumentationModal from './components/DocumentationModal';
import DailyResult from './components/DailyResult';
import DailyStatsModal from './components/DailyStatsModal';
import Footer from './components/Footer';
import { useGame } from './hooks/useGame';
import { calculatePoints, classicScoreWeights, dailyNumber, llmScoreWeights, type ScoreBreakdown } from './utils/gameUtils';
import type { GameMode } from './services/gameMode';
import './App.css';

const WARNING_THRESHOLD = 3;

function App() {
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [confirmDaily, setConfirmDaily] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const {
    // State
    score,
    round,
    gameEnded,
    consecutiveMisses,
    feedbackMessage,
    feedbackType,
    personaLine,
    isRevealed,
    inputDisabled,
    showNextButton,
    triggerShake,
    adaptiveHintNotice,
    llmMode,
    aiAvailable,
    messages,
    questionsAsked,
    isTyping,
    showWelcome,
    showDocs,
    outOfQuestions,
    currentFigure,
    revealedClues,
    lastRoundBreakdown,
    lastRoundNumber,
    guessTokens,
    isDaily,
    daily,
    roundOutcome,
    dailyStats,
    todayKey,
    todayResult,
    dailyInProgress,

    // Actions
    revealNextClue,
    handleAskQuestion,
    handleGuess,
    nextFigure,
    restartGame,
    handleStartGame,
    setMode,
    handleShowDocs,
    handleCloseDocs,
    resetConversation,
    handleValidationError,
    handleGiveUp,
    startDaily,
    startPractice,
    handleShared,

    // Constants
    QUESTION_LIMIT,
  } = useGame();

  const formatBreakdown = (breakdown: ScoreBreakdown): string => {
    const parts: string[] = [];
    parts.push(`${breakdown.basePoints}`);
    if (breakdown.cluePenalty > 0) {
      parts.push(`- ${breakdown.cluePenalty} (clues)`);
    }
    if (breakdown.hintPenalty > 0) {
      parts.push(`- ${breakdown.hintPenalty} (hints/questions)`);
    }
    if (breakdown.wrongGuessPenalty > 0) {
      parts.push(`- ${breakdown.wrongGuessPenalty} (misses)`);
    }
    return `${parts.join(' ')} = ${breakdown.total}`;
  };

  const currentRoundBreakdown: ScoreBreakdown | null = currentFigure
    ? calculatePoints(
        llmMode
          ? {
              cluesUsed: 1,
              adaptiveHintsUsed: questionsAsked,
              consecutiveMisses,
            }
          : {
              cluesUsed: revealedClues.length,
              adaptiveHintsUsed: 0,
              consecutiveMisses,
            },
        llmMode ? llmScoreWeights : classicScoreWeights,
      )
    : null;

  const inActiveRound = !gameEnded && !showNextButton;
  const breakdownToShow = inActiveRound ? currentRoundBreakdown : lastRoundBreakdown;
  const breakdownLabel = isDaily ? "Today's puzzle" : inActiveRound ? 'This round' : 'Last round';
  const breakdownRoundNumber = inActiveRound ? round : lastRoundNumber;

  const handleGiveUpRequest = () => {
    if (!inputDisabled && !showNextButton) {
      setShowGiveUpConfirm(true);
    }
  };

  const handleConfirmGiveUp = () => {
    setShowGiveUpConfirm(false);
    handleGiveUp();
  };

  const handleCancelGiveUp = () => {
    setShowGiveUpConfirm(false);
  };

  // Switching modes mid-game restarts the game, so ask first.
  const requestMode = (nextMode: GameMode) => {
    const midGame = !showWelcome && !gameEnded;
    if (midGame) {
      setPendingMode(nextMode);
    } else {
      setMode(nextMode);
    }
  };

  const handleConfirmMode = () => {
    if (pendingMode) setMode(pendingMode);
    setPendingMode(null);
  };

  const handleCancelMode = () => {
    setPendingMode(null);
  };

  // Opening the daily puzzle abandons a practice game, so ask first. Leaving the daily
  // puzzle loses nothing: an unfinished round is saved and resumes next time.
  const requestDaily = () => {
    const practiceInProgress = !isDaily && !showWelcome && !gameEnded;
    if (practiceInProgress) {
      setConfirmDaily(true);
    } else {
      startDaily();
    }
  };

  const handleConfirmDaily = () => {
    setConfirmDaily(false);
    startDaily();
  };

  const siteUrl = window.location.origin;

  if (!currentFigure) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-container">
      <Header
        llmMode={llmMode}
        aiAvailable={aiAvailable}
        isDaily={isDaily}
        onShowDocs={handleShowDocs}
        onShowStats={() => setShowStats(true)}
        onSwitchKind={isDaily ? startPractice : requestDaily}
        onToggleMode={() => requestMode(llmMode ? 'classic' : 'ai')}
      />
      <div className="character-and-score">
        <CharacterSilhouette revealed={isRevealed} eraTags={currentFigure.eraTags} />
        <div className="score-board">
          {breakdownToShow && (
            <div className="score-breakdown-inline">
              <span className="score-breakdown-inline-label">
                {breakdownLabel}
                {breakdownRoundNumber && !isDaily ? ` (Round ${breakdownRoundNumber})` : ''}:
              </span>
              <span className="score-breakdown-inline-value">
                {formatBreakdown(breakdownToShow)}
              </span>
            </div>
          )}
          <div className="score-item">
            <span className="score-label">{isDaily ? 'Daily' : 'Round'}</span>
            <span className="score-value">{isDaily && daily ? `#${daily.dayNumber}` : round}</span>
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
            canResetConversation={!inputDisabled}
          />
        ) : (
          <CluesList
            revealedClues={revealedClues}
            totalClues={currentFigure.clues.length}
            onRevealNextClue={() => revealNextClue()}
            disabled={inputDisabled}
          />
        )}

        <GuessInput
          onSubmitGuess={handleGuess}
          onAskQuestion={llmMode ? handleAskQuestion : undefined}
          disabled={inputDisabled || isTyping}
          triggerShake={triggerShake}
          llmMode={llmMode}
          onValidationError={handleValidationError}
          questionLimitReached={llmMode ? outOfQuestions : false}
          onGiveUp={handleGiveUpRequest}
          canGiveUp={!inputDisabled && !showNextButton}
          figureTokens={guessTokens}
        />

        <FeedbackMessage
          message={feedbackMessage}
          type={feedbackType}
          adaptiveHintNotice={adaptiveHintNotice}
          personaLine={personaLine}
        />

        {showNextButton && !isDaily && (
          <button className="next-btn" onClick={nextFigure}>
            Next Character
          </button>
        )}

        {isDaily && daily && roundOutcome && (
          <DailyResult
            dayNumber={daily.dayNumber}
            won={roundOutcome === 'won'}
            cluesUsed={revealedClues.length}
            totalClues={currentFigure.clues.length}
            score={score}
            siteUrl={siteUrl}
            onShare={handleShared}
            onShowStats={() => setShowStats(true)}
            onPractice={startPractice}
            onPlayNext={startDaily}
          />
        )}
      </main>

      <WelcomeModal
        isVisible={showWelcome}
        onStart={handleStartGame}
        onStartDaily={startDaily}
        dailyNumber={dailyNumber(todayKey)}
        dailyPlayed={Boolean(todayResult)}
        dailyInProgress={dailyInProgress}
        llmMode={llmMode}
        aiAvailable={aiAvailable}
        onSelectMode={setMode}
      />

      <DocumentationModal
        isVisible={showDocs}
        onClose={handleCloseDocs}
        llmMode={llmMode}
      />

      <GameOverModal
        isVisible={gameEnded && !isDaily}
        finalScore={score}
        onRestart={restartGame}
      />

      <DailyStatsModal
        isVisible={showStats}
        stats={dailyStats}
        todayKey={todayKey}
        onClose={() => setShowStats(false)}
      />

      {showGiveUpConfirm && (
        <div className="modal">
          <div className="modal-content confirm-modal">
            <h2 className="modal-title">Give up on this figure?</h2>
            <p className="modal-text">
              If you give up, the answer will be revealed and this round will end. You won't be able to ask
              more questions for this figure.
            </p>
            <div className="confirm-actions">
              <button className="modal-btn" onClick={handleConfirmGiveUp}>
                Yes, give up
              </button>
              <button className="modal-btn modal-btn-secondary" onClick={handleCancelGiveUp}>
                Continue playing
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingMode && (
        <div className="modal">
          <div className="modal-content confirm-modal">
            <h2 className="modal-title">Switch to {pendingMode === 'ai' ? 'AI' : 'Classic'} mode?</h2>
            <p className="modal-text">
              The two modes score rounds differently, so switching starts a new game and resets your score.
            </p>
            <div className="confirm-actions">
              <button className="modal-btn" onClick={handleConfirmMode}>
                Switch and restart
              </button>
              <button className="modal-btn modal-btn-secondary" onClick={handleCancelMode}>
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDaily && (
        <div className="modal">
          <div className="modal-content confirm-modal">
            <h2 className="modal-title">Open today's puzzle?</h2>
            <p className="modal-text">
              Your practice game will start over when you come back to it.
            </p>
            <div className="confirm-actions">
              <button className="modal-btn" onClick={handleConfirmDaily}>
                Play the daily
              </button>
              <button className="modal-btn modal-btn-secondary" onClick={() => setConfirmDaily(false)}>
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default App;
