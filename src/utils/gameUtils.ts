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

function calculatePenalties(
  cluesUsed: number,
  adaptiveHintsUsed: number,
  consecutiveMisses: number,
  weights: ScoreWeights
) {
  const extraClues = Math.max(0, cluesUsed - 1);
  const cluePenalty = extraClues * weights.extraClueWeight;
  const hintPenalty = Math.max(0, adaptiveHintsUsed) * weights.adaptiveHintWeight;
  const wrongGuessPenalty = Math.max(0, consecutiveMisses) * weights.wrongGuessWeight;

  return { cluePenalty, hintPenalty, wrongGuessPenalty };
}

export function calculatePoints(
  { cluesUsed, adaptiveHintsUsed, consecutiveMisses }: ScoringInputs,
  weights: ScoreWeights = classicScoreWeights
): ScoreBreakdown {
  const { cluePenalty, hintPenalty, wrongGuessPenalty } = calculatePenalties(
    cluesUsed,
    adaptiveHintsUsed,
    consecutiveMisses,
    weights
  );

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

export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function isCloseMatch(guess: string, answer: string): boolean {
  const normalizedGuess = guess.trim().toLowerCase();
  const normalizedAnswer = answer.trim().toLowerCase();

  if (normalizedGuess === normalizedAnswer) return true;

  // Check for partial match (e.g. "Einstein" in "Albert Einstein")
  // But only if the guess is at least 4 chars to avoid matching short common words
  if (normalizedGuess.length >= 4 && normalizedAnswer.includes(normalizedGuess)) {
    return true;
  }

  // Check for reverse partial match (e.g. "Albert Einstein" contains "Einstein")
  // This covers cases where the user might type the full name when only the last name is expected, though usually it's the other way around.
  if (normalizedAnswer.length >= 4 && normalizedGuess.includes(normalizedAnswer)) {
    return true;
  }

  // Fuzzy match with Levenshtein distance
  // Allow 1 error for every 5 characters, max 3 errors
  const maxErrors = Math.min(3, Math.floor(normalizedAnswer.length / 5) + 1);
  const distance = levenshteinDistance(normalizedGuess, normalizedAnswer);

  return distance <= maxErrors;
}
