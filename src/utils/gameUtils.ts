import type { Clue, HistoricFigure } from '../types';

export function shuffleArray(array: HistoricFigure[]): HistoricFigure[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculatePoints(cluesUsed: number): number {
  return Math.max(50, 100 - (cluesUsed - 1) * 10);
}

const difficultyRank: Record<Clue['difficulty'], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export function sortCluesByDifficulty(clues: Clue[]): Clue[] {
  return [...clues].sort((a, b) => difficultyRank[a.difficulty] - difficultyRank[b.difficulty]);
}

export function selectNextClue(
  figure: HistoricFigure,
  revealedClues: Clue[],
  consecutiveMisses: number,
  missThreshold = 2
): { nextClue: Clue | null; adaptive: boolean } {
  const revealedTexts = new Set(revealedClues.map(clue => clue.text));
  const remainingClues = figure.clues.filter(clue => !revealedTexts.has(clue.text));

  if (remainingClues.length === 0) {
    return { nextClue: null, adaptive: false };
  }

  const defaultNext = figure.clues.find(clue => !revealedTexts.has(clue.text)) ?? null;
  const shouldAdapt = consecutiveMisses >= missThreshold;

  if (!shouldAdapt || remainingClues.length === 1) {
    return { nextClue: defaultNext, adaptive: false };
  }

  const easiestRemaining = sortCluesByDifficulty(remainingClues)[0];
  const adaptive = easiestRemaining.text !== defaultNext?.text;

  return {
    nextClue: easiestRemaining,
    adaptive,
  };
}
