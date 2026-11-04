import React from 'react';

interface FooterProps {
  llmMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ llmMode }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" aria-label="About GuessMe">
      <div className="footer-brand">
        <h2 className="footer-title">GuessMe</h2>
        <p className="footer-description">
          Sharpen your deduction skills by pairing silhouettes with{' '}
          {llmMode ? 'clever questions' : 'carefully revealed clues'}.
        </p>
        <p className="footer-meta">Copyright © {currentYear} GuessMe</p>
      </div>

      <div className="footer-grid">
        <div className="footer-card">
          <h3 className="footer-heading">Play your way</h3>
          <p className="footer-text">
            {llmMode
              ? 'Ask each figure questions and get conversational hints tailored to what you ask.'
              : 'Reveal clues one at a time, from vague to obvious, and guess whenever you feel ready.'}
          </p>
        </div>
        <div className="footer-card">
          <h3 className="footer-heading">Score smarter</h3>
          <p className="footer-text">
            Limit your misses and {llmMode ? 'ask only the questions you need' : 'reveal clues only when you need them'}{' '}
            to maximize your round total.
          </p>
        </div>
        <div className="footer-card">
          <h3 className="footer-heading">Stuck on a figure?</h3>
          <p className="footer-text">
            Give up to see the answer and move to the next figure, or open How to Play for a quick refresher on the
            rules.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
