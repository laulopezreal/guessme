export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isGuess?: boolean;  // Mark messages that are guess attempts
  guessResult?: 'correct' | 'incorrect' | 'typo';  // Result of the guess
}

export interface Clue {
  text: string;
  difficulty: 'hard' | 'medium' | 'easy';
}

export interface HistoricFigure {
  name: string;
  alternateNames: string[];
  clues: Clue[];
  eraTags?: string[];
  voiceLine?: string;
}

export interface GameState {
  currentFigureIndex: number;
  currentClueIndex: number;
  score: number;
  round: number;
  gameEnded: boolean;
  shuffledFigures: HistoricFigure[];
}

export interface ConversationState {
  messages: Message[];
  questionsAsked: number;
  isTyping: boolean;
  hintLevel: number;
}

/** Which game the reducer is running: the endless practice game or today's puzzle. */
export type PlayKind = 'practice' | 'daily';

/** How the current round ended, if it has. */
export type RoundOutcome = 'won' | 'gave_up';

/** One finished daily puzzle, as kept in the player's stats. */
export interface DailyRecord {
  dateKey: string;
  dayNumber: number;
  won: boolean;
  cluesUsed: number;
  totalClues: number;
  score: number;
  misses: number;
}

export interface DailyStats {
  version: 1;
  played: number;
  won: number;
  currentStreak: number;
  bestStreak: number;
  /** Date key of the last puzzle recorded. */
  lastPlayed: string | null;
  /** Wins by the number of clues they needed, keyed by that number. */
  distribution: Record<string, number>;
  /** Finished puzzles by date key. */
  results: Record<string, DailyRecord>;
}

/** How a daily result left the app: the Web Share sheet, the clipboard, or a text box the player copies from. */
export type ShareMethod = 'share' | 'clipboard' | 'manual';
