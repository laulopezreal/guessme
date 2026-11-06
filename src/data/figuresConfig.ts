import type { HistoricFigure } from '../types';

export interface HistoricFigureConfig extends HistoricFigure {
  enabled: boolean;
}

/**
 * Figure Configuration
 *
 * This file is the single source of truth for the roster. It is imported by
 * the React app and by the Cloudflare Worker that proxies AI requests, so it
 * must stay free of browser-only or Node-only code.
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

export const allFigures: HistoricFigureConfig[] = [
  {
    enabled: true,
    name: "Albert Einstein",
    alternateNames: ["einstein", "albert", "albert einstein"],
    eraTags: ["Modern Era", "Physics"],
    voiceLine: "Imagination will take you everywhere—ready for your next thought experiment?",
    clues: [
      { text: "I was born in Germany in 1879.", difficulty: 'hard' },
      { text: "I won the Nobel Prize in Physics in 1921.", difficulty: 'medium' },
      { text: "I developed the theory of relativity.", difficulty: 'medium' },
      { text: "My famous equation is E=mc².", difficulty: 'easy' },
      { text: "I had distinctive wild white hair and often stuck out my tongue in photos.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Marie Curie",
    alternateNames: ["curie", "marie", "marie curie", "madame curie", "marie sklodowska-curie", "sklodowska"],
    eraTags: ["Industrial Age", "Chemistry"],
    voiceLine: "Nothing in life is to be feared—it is only to be understood. Onward?",
    clues: [
      { text: "I was born in Poland in 1867.", difficulty: 'hard' },
      { text: "I was the first woman to win a Nobel Prize.", difficulty: 'medium' },
      { text: "I won Nobel Prizes in both Physics and Chemistry.", difficulty: 'medium' },
      { text: "I discovered the elements polonium and radium.", difficulty: 'easy' },
      { text: "My research on radioactivity revolutionized science and medicine.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Leonardo da Vinci",
    alternateNames: ["leonardo", "da vinci", "leonardo da vinci"],
    eraTags: ["Renaissance", "Art & Invention"],
    voiceLine: "Simplicity is the ultimate sophistication. Ready for another masterpiece?",
    clues: [
      { text: "I was born in Italy in 1452.", difficulty: 'hard' },
      { text: "I was a polymath: artist, scientist, engineer, and inventor.", difficulty: 'medium' },
      { text: "I painted the Mona Lisa and The Last Supper.", difficulty: 'medium' },
      { text: "I designed flying machines and studied human anatomy.", difficulty: 'easy' },
      { text: "I wrote my notes in mirror writing (reversed text).", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "William Shakespeare",
    alternateNames: ["shakespeare", "william", "william shakespeare"],
    eraTags: ["Elizabethan", "Literature"],
    voiceLine: "All the world's a stage—shall we play another round?",
    clues: [
      { text: "I was born in Stratford-upon-Avon, England in 1564.", difficulty: 'hard' },
      { text: "I am considered the greatest writer in the English language.", difficulty: 'medium' },
      { text: "I wrote Romeo and Juliet, Hamlet, and Macbeth.", difficulty: 'medium' },
      { text: "I invented over 1,700 words still used in English today.", difficulty: 'easy' },
      { text: "I wrote 'To be or not to be, that is the question.'", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Nikola Tesla",
    alternateNames: ["tesla", "nikola", "nikola tesla"],
    eraTags: ["Industrial Age", "Engineering"],
    voiceLine: "The present is theirs; the future is mine. Ready to spark another idea?",
    clues: [
      { text: "I was born in the Austrian Empire (modern-day Croatia) in 1856.", difficulty: 'hard' },
      { text: "I was a brilliant inventor and electrical engineer.", difficulty: 'medium' },
      { text: "I developed alternating current (AC) electrical systems.", difficulty: 'medium' },
      { text: "I worked briefly for Thomas Edison before becoming his rival.", difficulty: 'easy' },
      { text: "The Tesla coil and the unit of magnetic flux density (tesla) are named after me.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Galileo Galilei",
    alternateNames: ["galileo", "galilei", "galileo galilei"],
    eraTags: ["Renaissance", "Astronomy"],
    voiceLine: "And yet it moves. Care to observe more?",
    clues: [
      { text: "I was born in Pisa, Italy in 1564.", difficulty: 'hard' },
      { text: "I am known as the father of modern observational astronomy.", difficulty: 'medium' },
      { text: "I improved the telescope and made astronomical observations.", difficulty: 'medium' },
      { text: "I discovered four moons of Jupiter, now called the Galilean moons.", difficulty: 'easy' },
      { text: "I was tried by the Inquisition for supporting heliocentrism (the idea that Earth orbits the Sun).", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Isaac Newton",
    alternateNames: ["newton", "isaac", "isaac newton"],
    eraTags: ["Scientific Revolution", "Mathematics"],
    voiceLine: "If I have seen further, it is by standing on shoulders—care to climb higher?",
    clues: [
      { text: "I was born in England in 1643.", difficulty: 'hard' },
      { text: "I formulated the laws of motion and universal gravitation.", difficulty: 'medium' },
      { text: "Legend says I discovered gravity when an apple fell on my head.", difficulty: 'medium' },
      { text: "I invented calculus (independently with Leibniz).", difficulty: 'easy' },
      { text: "I wrote 'Philosophiæ Naturalis Principia Mathematica', one of the most important scientific works ever.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Napoleon Bonaparte",
    alternateNames: ["napoleon", "bonaparte", "napoleon bonaparte"],
    eraTags: ["Napoleonic Era", "Military"],
    voiceLine: "Impossible is a word to be found only in the dictionary of fools. March to the next battle?",
    clues: [
      { text: "I was born on the island of Corsica in 1769.", difficulty: 'hard' },
      { text: "I became Emperor of France in 1804.", difficulty: 'medium' },
      { text: "I conquered much of Europe in the early 19th century.", difficulty: 'medium' },
      { text: "I was exiled twice, first to Elba and then to Saint Helena.", difficulty: 'easy' },
      { text: "I was known for being relatively short and keeping my hand in my coat.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Joan of Arc",
    alternateNames: ["joan", "joan of arc", "jeanne d'arc", "saint joan"],
    eraTags: ["Middle Ages", "Leadership"],
    voiceLine: "I am not afraid—I was born to do this. Shall we ride again?",
    clues: [
      { text: "I was a peasant girl born in France around 1412.", difficulty: 'hard' },
      { text: "I claimed to receive visions from God telling me to support France.", difficulty: 'medium' },
      { text: "I led French forces to victory at the Siege of Orléans during the Hundred Years' War.", difficulty: 'medium' },
      { text: "I was captured by the English and tried for heresy.", difficulty: 'easy' },
      { text: "I was burned at the stake at age 19 and later canonized as a saint.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Queen Elizabeth I",
    alternateNames: ["elizabeth i", "elizabeth", "queen elizabeth", "queen elizabeth i", "elizabeth tudor"],
    eraTags: ["Elizabethan", "Statesmanship"],
    voiceLine: "I know I have the body of a weak and feeble woman, but the heart of a king. Ready for another reign?",
    clues: [
      { text: "I was born in England in 1533.", difficulty: 'hard' },
      { text: "I became Queen of England in 1558 and ruled for 45 years.", difficulty: 'medium' },
      { text: "My reign is known as the Elizabethan Era, a golden age of English culture.", difficulty: 'medium' },
      { text: "I never married and was known as the 'Virgin Queen'.", difficulty: 'easy' },
      { text: "During my rule, England defeated the Spanish Armada in 1588.", difficulty: 'easy' }
    ]
  }
];

function toFigure(config: HistoricFigureConfig): HistoricFigure {
  const { name, alternateNames, clues, eraTags, voiceLine } = config;
  return { name, alternateNames, clues, eraTags, voiceLine };
}

/**
 * Stable, URL-safe identifier derived from a figure's name.
 * The client sends this to the AI API instead of the full figure data.
 */
export function figureId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all enabled figures for gameplay
 */
export function getEnabledFigures(): HistoricFigure[] {
  return allFigures.filter(figure => figure.enabled).map(toFigure);
}

/**
 * Look up an enabled figure by its id (see `figureId`).
 */
export function getFigureById(id: string): HistoricFigure | undefined {
  const match = allFigures.find(figure => figure.enabled && figureId(figure.name) === id);
  return match ? toFigure(match) : undefined;
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

/**
 * Export the raw figure data (without `enabled`) for tooling/tests that need the full list.
 */
export const historicFigures: HistoricFigure[] = allFigures.map(toFigure);
