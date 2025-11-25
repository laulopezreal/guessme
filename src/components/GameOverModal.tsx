interface GameOverModalProps {
  isVisible: boolean;
  finalScore: number;
  onRestart: () => void;
}

export default function GameOverModal({ isVisible, finalScore, onRestart }: GameOverModalProps) {
  if (!isVisible) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="modal-title">Game Complete!</h2>
        <p className="modal-text">You've guessed all the historic figures!</p>
        <p className="final-score">
          Final Score: <span>{finalScore}</span>
        </p>
        <button className="modal-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
