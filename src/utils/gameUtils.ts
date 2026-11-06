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

/**
 * Lowercase words that never identify a figure on their own: articles,
 * particles, titles and epithets. They are dropped from the AI-mode guess
 * tokens and never satisfy a partial match in Classic mode, so "queen",
 * "king" or "great" alone cannot solve a figure.
 */
const NAME_TOKEN_STOPWORDS = new Set([
  'the', 'of', 'and', 'von', 'van', 'della',
  'queen', 'king', 'emperor', 'empress', 'saint', 'lord', 'lady', 'sir', 'dame',
  'prince', 'princess', 'duke', 'duchess', 'pope', 'general', 'president', 'doctor', 'madame',
  'great', 'magnificent', 'conqueror', 'jr',
]);

/**
 * The words of a name that are long and specific enough to point at a
 * figure: four or more letters and not a stopword.
 */
function distinctiveNameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\p{L}'-]/gu, ''))
    .filter(token => token.length >= 4 && !NAME_TOKEN_STOPWORDS.has(token));
}

export function isCloseMatch(guess: string, answer: string): boolean {
  const normalizedGuess = guess.trim().toLowerCase();
  const normalizedAnswer = answer.trim().toLowerCase();

  if (normalizedGuess === normalizedAnswer) return true;

  // Partial match (e.g. "Einstein" in "Albert Einstein"). The contained text
  // must be at least 4 characters and carry a distinctive name token, so a
  // bare title or epithet ("queen", "king", "great") never wins on its own.
  if (
    normalizedGuess.length >= 4 &&
    normalizedAnswer.includes(normalizedGuess) &&
    distinctiveNameTokens(normalizedGuess).length > 0
  ) {
    return true;
  }

  // Reverse partial match (e.g. the guess "Albert Einstein" contains the
  // answer "Einstein"), under the same distinctive-token rule.
  if (
    normalizedAnswer.length >= 4 &&
    normalizedGuess.includes(normalizedAnswer) &&
    distinctiveNameTokens(normalizedAnswer).length > 0
  ) {
    return true;
  }

  // Fuzzy match with Levenshtein distance
  // Allow 1 error for every 5 characters, max 3 errors
  const maxErrors = Math.min(3, Math.floor(normalizedAnswer.length / 5) + 1);
  const distance = levenshteinDistance(normalizedGuess, normalizedAnswer);

  return distance <= maxErrors;
}

/**
 * Lowercase name fragments that strongly suggest a guess when they appear in
 * a question ("are you einstein?"). Titles and generic words are excluded so
 * ordinary questions ("are you the queen?", "were you great?") still count
 * as questions.
 */
export function getFigureNameTokens(figures: HistoricFigure[]): string[] {
  const tokens = new Set<string>();
  for (const figure of figures) {
    for (const name of [figure.name, ...figure.alternateNames]) {
      for (const token of distinctiveNameTokens(name)) {
        tokens.add(token);
      }
    }
  }
  return [...tokens];
}

/* ========================================
   Daily puzzle
   ======================================== */

/** UTC date of puzzle #1. Changing it renumbers every puzzle, so leave it alone. */
export const DAILY_EPOCH = '2026-11-04';

/** Free questions to today's figure after the reveal, per puzzle. */
export const DAILY_ASK_LIMIT = 3;

const MS_PER_DAY = 86_400_000;

/** The calendar date in UTC as `YYYY-MM-DD`: the key everyone shares for a puzzle. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcMidnight(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** The date key `days` days after `dateKey` (negative values go back). */
export function shiftDateKey(dateKey: string, days: number): string {
  return utcDateKey(new Date(utcMidnight(dateKey) + days * MS_PER_DAY));
}

/** Puzzle number for a date key; the epoch is #1. */
export function dailyNumber(dateKey: string, epoch = DAILY_EPOCH): number {
  return Math.round((utcMidnight(dateKey) - utcMidnight(epoch)) / MS_PER_DAY) + 1;
}

/** Milliseconds until the next UTC midnight, when the puzzle changes. */
export function msUntilNextUtcDay(now: Date): number {
  const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, nextMidnight - now.getTime());
}

/** 32-bit FNV-1a hash of a string: tiny, dependency-free and identical in every browser. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a small seeded random number generator, enough to shuffle a roster. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const shuffled = [...items];
  const random = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** What the daily schedule needs to know about a roster entry. */
export interface DailyEntry {
  /** The first UTC date the figure may be scheduled: it joins the first cycle that starts on or after this date. */
  dailyFrom: string;
  /** A disabled figure keeps its slots and a stand-in plays them, so pulling it moves nobody else's day. */
  enabled: boolean;
}

interface DailyCycle<T> {
  index: number;
  /** The cycle's first day, counted from the epoch. */
  start: number;
  members: T[];
  previousMembers: T[];
}

/**
 * The cycle a day falls in. Cycles run back to back from the epoch, and each
 * one takes the figures whose `dailyFrom` had arrived on its first day, so a
 * figure added later only changes cycles that have not started.
 */
function findCycle<T extends DailyEntry>(dayIndex: number, roster: readonly T[], epoch: string): DailyCycle<T> | null {
  const membersOn = (day: number) => roster.filter(entry => dailyNumber(entry.dailyFrom, epoch) - 1 <= day);

  const launch = membersOn(0);
  if (launch.length === 0) return null;

  // Before the epoch, which only a wrong device clock can reach, the launch roster repeats backwards.
  if (dayIndex < 0) {
    const index = Math.floor(dayIndex / launch.length);
    return { index, start: index * launch.length, members: launch, previousMembers: launch };
  }

  let cycle: DailyCycle<T> = { index: 0, start: 0, members: launch, previousMembers: launch };
  while (dayIndex >= cycle.start + cycle.members.length) {
    const start = cycle.start + cycle.members.length;
    cycle = { index: cycle.index + 1, start, members: membersOn(start), previousMembers: cycle.members };
  }
  return cycle;
}

/**
 * The order figures appear in during one cycle.
 * When a cycle would open with the figure that closed the previous one, the
 * first two days swap so no figure runs two days in a row (rosters of three
 * or more; the swap never touches the last day, so the check stays local).
 */
function cycleOrder<T>({ index, members, previousMembers }: DailyCycle<T>, epoch: string): T[] {
  const order = seededShuffle(members, hashString(`${epoch}#${index}`));
  if (order.length > 2) {
    const previous = seededShuffle(previousMembers, hashString(`${epoch}#${index - 1}`));
    if (order[0] === previous[previous.length - 1]) {
      [order[0], order[1]] = [order[1], order[0]];
    }
  }
  return order;
}

/**
 * The figure for a UTC date. Each cycle is its own deterministic shuffle, so a
 * figure never repeats until every other figure has had its day, and the same
 * date gives the same figure on every device with no server involved.
 *
 * Pass the full roster, disabled figures included. The shuffle works on array
 * positions, so the schedule survives added and renamed figures, but not
 * reordered or deleted ones (see FIGURES.md).
 */
export function selectDailyFigure<T extends DailyEntry>(dateKey: string, roster: readonly T[], epoch = DAILY_EPOCH): T | undefined {
  const dayIndex = dailyNumber(dateKey, epoch) - 1;
  const cycle = findCycle(dayIndex, roster, epoch);
  if (!cycle) return undefined;

  const order = cycleOrder(cycle, epoch);
  const position = dayIndex - cycle.start;
  if (order[position].enabled) return order[position];

  // Stand-ins come from about half a cycle away, so nobody plays two days running.
  for (let step = 0; step < order.length; step++) {
    const standIn = order[(position + Math.floor(order.length / 2) + step) % order.length];
    if (standIn.enabled) return standIn;
  }
  return undefined;
}

export interface DailyPuzzle<T> {
  dateKey: string;
  dayNumber: number;
  figure: T;
}

/** The puzzle for the UTC day containing `now`, or null when there is no figure to schedule. */
export function getDailyPuzzle<T extends DailyEntry>(roster: readonly T[], now: Date): DailyPuzzle<T> | null {
  const dateKey = utcDateKey(now);
  const figure = selectDailyFigure(dateKey, roster);
  return figure === undefined ? null : { dateKey, dayNumber: dailyNumber(dateKey), figure };
}

export interface DailyShareInput {
  dayNumber: number;
  won: boolean;
  cluesUsed: number;
  totalClues: number;
  score: number;
  url: string;
}

/** One square per clue revealed, then a tick for a solve or a cross for a give-up. */
export function dailyResultGrid(cluesUsed: number, totalClues: number, won: boolean): string {
  const revealed = Math.min(Math.max(cluesUsed, 0), totalClues);
  return `${'🟦'.repeat(revealed)}${'⬜'.repeat(totalClues - revealed)} ${won ? '✅' : '❌'}`;
}

/** The Wordle-style result people paste into chats. */
export function buildDailyShareText({ dayNumber, won, cluesUsed, totalClues, score, url }: DailyShareInput): string {
  const revealed = Math.min(Math.max(cluesUsed, 0), totalClues);
  const summary = won ? `${revealed}/${totalClues} clues` : 'gave up';
  return [
    `Who Am I? #${dayNumber} · ${summary}`,
    `${dailyResultGrid(cluesUsed, totalClues, won)} ${score} pts`,
    url,
  ].join('\n');
}

/** `HH:MM:SS` for a countdown. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(part => String(part).padStart(2, '0')).join(':');
}

/** Leading titles and honorifics that are not part of a person's name. */
const NAME_TITLES = new Set([
  'queen', 'king', 'prince', 'princess', 'emperor', 'empress', 'saint', 'st', 'st.',
  'sir', 'dame', 'lady', 'lord', 'pope', 'president', 'general', 'mansa', 'mahatma',
]);

/** Arabic "son of": not a name on its own, so it stays with the word after it. */
const NAME_PARTICLES = new Set(['ibn']);

/** The name to address a figure by in short copy: the first name, skipping a leading title. */
export function figureShortName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words.findIndex(word => !NAME_TITLES.has(word.toLowerCase()));
  if (first === -1) return name;
  const next = words[first + 1];
  return NAME_PARTICLES.has(words[first].toLowerCase()) && next ? `${words[first]} ${next}` : words[first];
}
