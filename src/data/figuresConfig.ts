import type { HistoricFigure } from '../types';

/**
 * Figure Configuration
 * 
 * To add a new figure:
 * 1. Add a new object to the array below
 * 2. Set enabled: true when ready
 * 
 * To edit a figure:
 * - Update the properties directly
 * 
 * To remove a figure:
 * - Set enabled: false (soft delete, keeps data)
 * - Or remove the object entirely (hard delete)
 */

export const allFigures: Array<HistoricFigure & { enabled: boolean }> = [
  {
    enabled: true,
    name: "Albert Einstein",
    alternateNames: ["einstein"],
    clues: [
      "I was born in Germany in 1879.",
      "I won the Nobel Prize in Physics in 1921.",
      "I developed the theory of relativity.",
      "My famous equation is E=mc².",
      "I had distinctive wild white hair and often stuck out my tongue in photos."
    ]
  },
  {
    enabled: true,
    name: "Marie Curie",
    alternateNames: ["curie", "marie sklodowska-curie"],
    clues: [
      "I was born in Poland in 1867.",
      "I was the first woman to win a Nobel Prize.",
      "I won Nobel Prizes in both Physics and Chemistry.",
      "I discovered the elements polonium and radium.",
      "My research on radioactivity revolutionized science and medicine."
    ]
  },
  {
    enabled: true,
    name: "Leonardo da Vinci",
    alternateNames: ["leonardo", "da vinci"],
    clues: [
      "I was born in Italy in 1452.",
      "I was a polymath: artist, scientist, engineer, and inventor.",
      "I painted the Mona Lisa and The Last Supper.",
      "I designed flying machines and studied human anatomy.",
      "I wrote my notes in mirror writing (reversed text)."
    ]
  },
  {
    enabled: true,
    name: "William Shakespeare",
    alternateNames: ["shakespeare"],
    clues: [
      "I was born in Stratford-upon-Avon, England in 1564.",
      "I am considered the greatest writer in the English language.",
      "I wrote Romeo and Juliet, Hamlet, and Macbeth.",
      "I invented over 1,700 words still used in English today.",
      "I wrote 'To be or not to be, that is the question.'"
    ]
  },
  {
    enabled: true,
    name: "Nikola Tesla",
    alternateNames: ["tesla"],
    clues: [
      "I was born in the Austrian Empire (modern-day Croatia) in 1856.",
      "I was a brilliant inventor and electrical engineer.",
      "I developed alternating current (AC) electrical systems.",
      "I worked briefly for Thomas Edison before becoming his rival.",
      "The Tesla coil and the unit of magnetic flux density (tesla) are named after me."
    ]
  },
  // Additional figures (disabled by default for testing)
  {
    enabled: false,
    name: "Galileo Galilei",
    alternateNames: ["galileo"],
    clues: [
      "I was born in Pisa, Italy in 1564.",
      "I am known as the father of modern observational astronomy.",
      "I improved the telescope and made astronomical observations.",
      "I discovered four moons of Jupiter, now called the Galilean moons.",
      "I was tried by the Inquisition for supporting heliocentrism (the idea that Earth orbits the Sun)."
    ]
  },
  {
    enabled: false,
    name: "Isaac Newton",
    alternateNames: ["newton"],
    clues: [
      "I was born in England in 1643.",
      "I formulated the laws of motion and universal gravitation.",
      "Legend says I discovered gravity when an apple fell on my head.",
      "I invented calculus (independently with Leibniz).",
      "I wrote 'Philosophiæ Naturalis Principia Mathematica', one of the most important scientific works ever."
    ]
  },
  {
    enabled: false,
    name: "Napoleon Bonaparte",
    alternateNames: ["napoleon"],
    clues: [
      "I was born on the island of Corsica in 1769.",
      "I became Emperor of France in 1804.",
      "I conquered much of Europe in the early 19th century.",
      "I was exiled twice, first to Elba and then to Saint Helena.",
      "I was known for being relatively short and keeping my hand in my coat."
    ]
  },
  {
    enabled: false,
    name: "Joan of Arc",
    alternateNames: ["joan", "jeanne d'arc"],
    clues: [
      "I was a peasant girl born in France around 1412.",
      "I claimed to receive visions from God telling me to support France.",
      "I led French forces to victory at the Siege of Orléans during the Hundred Years' War.",
      "I was captured by the English and tried for heresy.",
      "I was burned at the stake at age 19 and later canonized as a saint."
    ]
  },
  {
    enabled: false,
    name: "Queen Elizabeth I",
    alternateNames: ["elizabeth i", "elizabeth", "queen elizabeth"],
    clues: [
      "I was born in England in 1533.",
      "I became Queen of England in 1558 and ruled for 45 years.",
      "My reign is known as the Elizabethan Era, a golden age of English culture.",
      "I never married and was known as the 'Virgin Queen'.",
      "During my rule, England defeated the Spanish Armada in 1588."
    ]
  }
];

/**
 * Get all enabled figures for gameplay
 */
export function getEnabledFigures(): HistoricFigure[] {
  return allFigures
    .filter(figure => figure.enabled)
    .map(({ enabled, ...figure }) => figure);
}

/**
 * Get figure count
 */
export function getFigureCount(): { enabled: number; total: number } {
  return {
    enabled: allFigures.filter(f => f.enabled).length,
    total: allFigures.length
  };
}
