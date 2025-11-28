import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" aria-label="About GuessMe">
      <div className="footer-brand">
        <h2 className="footer-title">GuessMe</h2>
        <p className="footer-description">
          Sharpen your deduction skills by pairing silhouettes with clever questions or carefully revealed clues.
        </p>
        <p className="footer-meta">Copyright \u00a9 {currentYear} GuessMe</p>
      </div>

      <div className="footer-grid">
        <div className="footer-card">
          <h3 className="footer-heading">Play your way</h3>
          <p className="footer-text">
            Toggle between Classic and LLM modes to swap manual clues for conversational hints tailored to your
            questions.
          </p>
        </div>
        <div className="footer-card">
          <h3 className="footer-heading">Score smarter</h3>
          <p className="footer-text">
            Keep streaks alive by limiting misses and only revealing clues when needed to maximize your round total.
          </p>
        </div>
        <div className="footer-card">
          <h3 className="footer-heading">Need a reset?</h3>
          <p className="footer-text">
            Restart anytime to tackle a fresh set of figures, or open the docs for a quick refresher on the rules.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
