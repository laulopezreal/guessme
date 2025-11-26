import Header from './components/Header';
import CharacterSilhouette from './components/CharacterSilhouette';
import CluesList from './components/CluesList';
import GuessInput from './components/GuessInput';
import FeedbackMessage from './components/FeedbackMessage';
import GameOverModal from './components/GameOverModal';
import ConversationView from './components/ConversationView';
import WelcomeModal from './components/WelcomeModal';
import DocumentationModal from './components/DocumentationModal';
import { useGame } from './hooks/useGame';
import './App.css';

const WARNING_THRESHOLD = 3;

function App() {
  const {
    // State
    score,
    round,
    gameEnded,
    feedbackMessage,
    feedbackType,
    personaLine,
    isRevealed,
    inputDisabled,
    showNextButton,
    triggerShake,
    adaptiveHintNotice,
    llmMode,
    messages,
    questionsAsked,
    isTyping,
    showWelcome,
    showDocs,
    outOfQuestions,
    currentFigure,
    revealedClues,

    // Actions
    revealNextClue,
    handleAskQuestion,
    handleGuess,
    nextFigure,
    handleModeToggle,
    restartGame,
    handleStartGame,
    handleShowDocs,
    handleCloseDocs,
    resetConversation,
    handleValidationError,
    handleGiveUp,

    // Constants
    QUESTION_LIMIT,
  } = useGame();

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
        />

        <FeedbackMessage
          message={feedbackMessage}
          type={feedbackType}
          adaptiveHintNotice={adaptiveHintNotice}
          personaLine={personaLine}
        />

        {!inputDisabled && !showNextButton && (
          <button className="give-up-btn" onClick={handleGiveUp}>
            Give Up
          </button>
        )}

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
