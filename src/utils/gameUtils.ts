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
 * tokens. In Classic mode they never make a partial match, an answer made only
 * of them is never found inside a longer guess, and a guess made only of them
 * never wins as a near spelling, so "queen", "great" or "empress" alone cannot
 * solve a figure.
 */
const NAME_TOKEN_STOPWORDS = new Set([
  'the', 'of', 'and', 'von', 'van', 'della',
  'queen', 'king', 'emperor', 'empress', 'saint', 'lord', 'lady', 'sir', 'dame',
  'prince', 'princess', 'duke', 'duchess', 'pope', 'general', 'president', 'doctor', 'madame',
  'great', 'magnificent', 'conqueror', 'jr',
]);

/**
 * A name or a guess as lowercase words. Anything but a letter (accents
 * included), a digit or an apostrophe separates words, so "Dr. King" is
 * "dr king" and "Sklodowska-Curie" is "sklodowska curie". Curly apostrophes
 * count as straight ones.
 */
function nameWords(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^\p{L}\p{M}\p{N}']+/u)
    .map(word => word.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

/** A word long and specific enough to point at a figure: four or more letters and not a stopword. */
function isDistinctive(word: string): boolean {
  return word.length >= 4 && !NAME_TOKEN_STOPWORDS.has(word);
}

/** Whether `run` appears in `words` as consecutive whole words. */
function containsWords(words: string[], run: string[]): boolean {
  if (run.length === 0) return false;
  for (let start = 0; start + run.length <= words.length; start++) {
    if (run.every((word, offset) => words[start + offset] === word)) return true;
  }
  return false;
}

/** A leading "the" is optional: "Liberator" answers "the liberator". */
function withoutLeadingThe(words: string[]): string[] {
  return words.length > 1 && words[0] === 'the' ? words.slice(1) : words;
}

/**
 * Near spellings of an answer this short (in characters) must keep its first
 * letter: changing the first letter turns "turing" into the everyday word
 * "during", and two edits turn "charles" into "shares".
 */
const FIRST_LETTER_MAX_LENGTH = 7;

/**
 * Whether `guess` is a near spelling of `answer`: one edit (a letter added,
 * dropped or changed) from an answer of up to four characters, two up to nine
 * and three beyond, with the right first letter for an answer of up to
 * FIRST_LETTER_MAX_LENGTH characters.
 */
function isNearSpelling(guess: string, answer: string): boolean {
  if (answer.length <= FIRST_LETTER_MAX_LENGTH && guess[0] !== answer[0]) return false;
  const maxErrors = Math.min(3, Math.floor(answer.length / 5) + 1);
  return levenshteinDistance(guess, answer) <= maxErrors;
}

/** Words that join the parts of a name: "Leonardo da Vinci", "Joan of Arc", "Elizabeth the First". */
const NAME_JOINING_WORDS = new Set(['the', 'of', 'and', 'da', 'de', 'di', 'del', 'della', 'van', 'von', 'du', 'le', 'la', 'el', 'y']);

/**
 * Titles and honorifics a guess may put around any answer: "Sir Isaac Newton",
 * "Emperor Napoleon", "Dr. King". They are not checked against the figure, so
 * "King Charles" still wins for Charles Darwin through "charles".
 */
const GUESS_TITLES = new Set([
  'queen', 'king', 'emperor', 'empress', 'prince', 'princess', 'duke', 'duchess', 'pope', 'saint', 'st',
  'lord', 'lady', 'pharaoh', 'sultan', 'mansa', 'tsar', 'czar', 'tsarina', 'czarina', 'count', 'countess',
  'sir', 'dame', 'general', 'president', 'doctor', 'dr', 'madame', 'mr', 'mrs', 'ms', 'miss',
  'professor', 'prof', 'rev', 'reverend', 'mahatma', 'admiral', 'master', 'captain', 'commander', 'prime', 'minister',
]);

/** Words that turn a guess into a question: "Is it Einstein?". "I" is left out because it is also an ordinal ("Charles I"). */
const GUESS_QUESTION_WORDS = new Set([
  'is', 'it', "it's", 'its', 'are', 'you', "you're", 'maybe', 'perhaps', 'probably', 'my', 'guess', 'answer', 'think', 'obviously',
]);

const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi'];
const ORDINAL_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ORDINAL_ABBREVIATIONS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

/**
 * Each way of writing an ordinal, mapped to the Roman numeral it means: "I",
 * "1", "1st" and "first" are one ordinal, and "Jr." and "junior" another.
 */
const ORDINALS = new Map<string, string>([
  ...ROMAN_NUMERALS.flatMap((numeral, index): [string, string][] => [[numeral, numeral], [String(index + 1), numeral]]),
  ...ORDINAL_WORDS.map((word, index): [string, string] => [word, ROMAN_NUMERALS[index]]),
  ...ORDINAL_ABBREVIATIONS.map((word, index): [string, string] => [word, ROMAN_NUMERALS[index]]),
  ['jr', 'jr'], ['junior', 'jr'], ['sr', 'sr'], ['senior', 'sr'],
]);

/** The ordinals among some words, sorted, so "Elizabeth the 1st" and "Elizabeth I" both give "i". */
function ordinalsIn(words: string[]): string {
  return words.flatMap(word => ORDINALS.get(word) ?? []).sort().join(' ');
}

/** What a guess may add around one of a figure's names, worked out from all of them. */
interface FigureWords {
  /** Every word of every name. */
  words: Set<string>;
  /** The first letters of those words, for initials ("W. A. Mozart"). */
  initials: Set<string>;
  /** The figure's own ordinals, such as "i" for Elizabeth I and "jr" for Martin Luther King Jr. */
  ordinals: Set<string>;
}

function figureWords(names: readonly string[]): FigureWords {
  const words = new Set(names.flatMap(name => nameWords(name)));
  const initials = new Set<string>();
  const ordinals = new Set<string>();
  for (const word of words) {
    const ordinal = ORDINALS.get(word);
    if (ordinal) ordinals.add(ordinal);
    else if (!NAME_JOINING_WORDS.has(word)) initials.add(word[0]);
  }
  return { words, initials, ordinals };
}

/**
 * Whether a word that a guess adds around an answer still points at the same
 * figure: one of the figure's own words, an initial of one, its own ordinal,
 * a near spelling of one of its distinctive words ("Issac" for "isaac"), a
 * title, a joining word or a question word.
 */
function belongsWithFigure(word: string, figure: FigureWords): boolean {
  if (figure.words.has(word) || NAME_JOINING_WORDS.has(word)) return true;
  if (GUESS_TITLES.has(word) || GUESS_QUESTION_WORDS.has(word)) return true;
  if (word.length === 1 && figure.initials.has(word)) return true;
  const ordinal = ORDINALS.get(word);
  if (ordinal) return figure.ordinals.has(ordinal);
  return word.length >= 4 && [...figure.words].some(own => isDistinctive(own) && isNearSpelling(word, own));
}

/**
 * Whether the guess holds the whole answer as consecutive words and every
 * other word in it belongs with the figure. The answer needs a word that is
 * not a stopword, so "the queen of england" never wins through "queen".
 */
function containsAnswer(guessWords: string[], answerWords: string[], figureNames: readonly string[]): boolean {
  if (answerWords.every(word => NAME_TOKEN_STOPWORDS.has(word))) return false;
  for (let start = 0; start + answerWords.length <= guessWords.length; start++) {
    if (!answerWords.every((word, offset) => guessWords[start + offset] === word)) continue;
    const figure = figureWords(figureNames);
    const extraWords = [...guessWords.slice(0, start), ...guessWords.slice(start + answerWords.length)];
    if (extraWords.every(word => belongsWithFigure(word, figure))) return true;
  }
  return false;
}

export interface CloseMatchOptions {
  /** Let part of the answer win ("Einstein" for "Albert Einstein"). Pass false for an answer that must be typed in full. */
  allowPart?: boolean;
  /**
   * Every name of the figure the answer belongs to. A guess may add their
   * words around the answer ("Albert Einstein" for "einstein"). Defaults to
   * the answer alone.
   */
  figureNames?: readonly string[];
}

/**
 * Whether a guess matches one answer, comparing whole words and ignoring
 * case, punctuation and a leading "the". The guess matches when it:
 * - is the answer;
 * - is part of the answer, as whole words that include a distinctive one
 *   ("Einstein" for "Albert Einstein", but not "night" for "Nightingale" or
 *   "the great" for "Alexander the Great"). Pass `allowPart: false` for an
 *   answer that must be typed in full;
 * - contains the whole answer, when every other word belongs with the
 *   figure: a word of one of `figureNames`, an initial or near spelling of
 *   one, the figure's own ordinal, a title, a joining word such as "the" or
 *   "da", or a question word. So "Sir Isaac Newton", "W. A. Mozart" and "Is
 *   it Einstein?" win, but "Marie Antoinette" does not win through "marie",
 *   nor "Elizabeth II" through "elizabeth";
 * - or is a near spelling with the same ordinals: one edit (a letter added,
 *   dropped or changed) from an answer of up to four characters, two up to
 *   nine and three beyond. The guess needs a word that is not a stopword,
 *   and an answer of up to FIRST_LETTER_MAX_LENGTH characters needs the right
 *   first letter.
 */
export function isCloseMatch(
  guess: string,
  answer: string,
  { allowPart = true, figureNames = [answer] }: CloseMatchOptions = {}
): boolean {
  const guessWords = withoutLeadingThe(nameWords(guess));
  const answerWords = withoutLeadingThe(nameWords(answer));
  if (guessWords.length === 0 || answerWords.length === 0) return false;

  const normalizedGuess = guessWords.join(' ');
  const normalizedAnswer = answerWords.join(' ');
  if (normalizedGuess === normalizedAnswer) return true;

  if (allowPart && containsWords(answerWords, guessWords) && guessWords.some(isDistinctive)) return true;
  if (containsAnswer(guessWords, answerWords, figureNames)) return true;

  if (guessWords.every(word => NAME_TOKEN_STOPWORDS.has(word))) return false;
  if (ordinalsIn(guessWords) !== ordinalsIn(answerWords)) return false;
  return isNearSpelling(normalizedGuess, normalizedAnswer);
}

/**
 * Classic mode's win check: the guess matches the figure's name or one of
 * its alternate names. Only the name accepts part of itself ("Vinci" for
 * "Leonardo da Vinci"). An alternate name must be typed in full, typos
 * allowed, so the place or title in "catherine ii of russia" or "sultan
 * suleiman" never wins on its own. Words from any of the figure's names may
 * surround an answer, so "Albert Einstein" wins through "einstein", while
 * "Marie Antoinette" does not win for Marie Curie through "marie".
 */
export function isCorrectGuess(guess: string, figure: Pick<HistoricFigure, 'name' | 'alternateNames'>): boolean {
  const figureNames = [figure.name, ...figure.alternateNames];
  return (
    isCloseMatch(guess, figure.name, { figureNames }) ||
    figure.alternateNames.some(alternate => isCloseMatch(guess, alternate, { allowPart: false, figureNames }))
  );
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
      for (const word of nameWords(name)) {
        if (isDistinctive(word)) tokens.add(word);
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
