import type { Clue, HistoricFigure } from '../types';

export function shuffleArray(array: HistoricFigure[]): HistoricFigure[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface ScoreWeights {
  basePoints: number;
  minPoints: number;
  extraClueWeight: number;
  adaptiveHintWeight: number;
  wrongGuessWeight: number;
}

export const classicScoreWeights: ScoreWeights = {
  basePoints: 100,
  minPoints: 50,
  extraClueWeight: 10,
  adaptiveHintWeight: 5,
  wrongGuessWeight: 5,
};

export const llmScoreWeights: ScoreWeights = {
  basePoints: 100,
  minPoints: 25,
  extraClueWeight: 10,
  adaptiveHintWeight: 5,
  wrongGuessWeight: 5,
};

export interface ScoreBreakdown {
  basePoints: number;
  minPoints: number;
  cluesUsed: number;
  adaptiveHintsUsed: number;
  consecutiveMisses: number;
  cluePenalty: number;
  hintPenalty: number;
  wrongGuessPenalty: number;
  rawTotal: number;
  total: number;
}

export interface ScoringInputs {
  cluesUsed: number;
  adaptiveHintsUsed: number;
  consecutiveMisses: number;
}

export function calculatePoints(
  { cluesUsed, adaptiveHintsUsed, consecutiveMisses }: ScoringInputs,
  weights: ScoreWeights = classicScoreWeights
): ScoreBreakdown {
  const extraClues = Math.max(0, cluesUsed - 1);
  const cluePenalty = extraClues * weights.extraClueWeight;
  const hintPenalty = Math.max(0, adaptiveHintsUsed) * weights.adaptiveHintWeight;
  const wrongGuessPenalty = Math.max(0, consecutiveMisses) * weights.wrongGuessWeight;

  const rawTotal = weights.basePoints - cluePenalty - hintPenalty - wrongGuessPenalty;
  const total = Math.max(weights.minPoints, rawTotal);

  return {
    basePoints: weights.basePoints,
    minPoints: weights.minPoints,
    cluesUsed,
    adaptiveHintsUsed,
    consecutiveMisses,
    cluePenalty,
    hintPenalty,
    wrongGuessPenalty,
    rawTotal,
    total,
  };
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
