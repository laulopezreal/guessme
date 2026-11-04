import type { HistoricFigure, Clue, Message, PlayKind, RoundOutcome } from '../types';
import { getDefaultGameMode, type GameMode } from '../services/gameMode';
import type { ScoreBreakdown } from '../utils/gameUtils';

export interface GameState {
  // Game Data
  shuffledFigures: HistoricFigure[];
  currentFigureIndex: number;

  // Round State
  revealedClues: Array<Clue & { isAdaptive?: boolean }>;
  consecutiveMisses: number;
  score: number;
  round: number;
  gameEnded: boolean;

  // UI State
  feedbackMessage: string;
  feedbackType: 'success' | 'error' | '';
  personaLine: string;
  isRevealed: boolean;
  inputDisabled: boolean;
  showNextButton: boolean;
  triggerShake: boolean;
  adaptiveHintNotice: string;
  showWelcome: boolean;
  showDocs: boolean;

  // LLM State
  llmMode: boolean;
  aiStatus: 'unknown' | 'available' | 'unavailable';
  messages: Message[];
  questionsAsked: number;
  isTyping: boolean;
  outOfQuestions: boolean;

  // Scoring summary
  lastRoundBreakdown: ScoreBreakdown | null;
  lastRoundNumber: number | null;

  // Daily puzzle. Practice is the endless game; daily is one shared figure a day under Classic rules.
  playKind: PlayKind;
  daily: { dateKey: string; dayNumber: number } | null;
  roundOutcome: RoundOutcome | null;
}

export const initialState: GameState = {
  shuffledFigures: [],
  currentFigureIndex: 0,
  revealedClues: [],
  consecutiveMisses: 0,
  score: 0,
  round: 1,
  gameEnded: false,
  feedbackMessage: '',
  feedbackType: '',
  personaLine: '',
  isRevealed: false,
  inputDisabled: false,
  showNextButton: false,
  triggerShake: false,
  adaptiveHintNotice: '',
  showWelcome: true,
  showDocs: false,
  llmMode: getDefaultGameMode() === 'ai',
  aiStatus: 'unknown',
  messages: [],
  questionsAsked: 0,
  isTyping: false,
  outOfQuestions: false,
  lastRoundBreakdown: null,
  lastRoundNumber: null,
  playKind: 'practice',
  daily: null,
  roundOutcome: null,
};

export type GameAction =
  | { type: 'INIT_GAME'; payload: { figures: HistoricFigure[] } }
  | { type: 'START_GAME' }
  | { type: 'RESTART_GAME'; payload: { figures: HistoricFigure[]; mode?: GameMode } }
  | { type: 'SET_MODE'; payload: { mode: GameMode } }
  | { type: 'SET_AI_STATUS'; payload: { available: boolean } }
  | { type: 'NEXT_FIGURE' }
  | { type: 'TOGGLE_DOCS'; payload: boolean }
  | { type: 'REVEAL_CLUE'; payload: { clue: Clue; isAdaptive?: boolean; adaptiveNotice?: string } }
  | { type: 'REGISTER_MISS'; payload: { feedback: string; triggerShake?: boolean } }
  | { type: 'CORRECT_GUESS'; payload: { scoreDelta: number; feedback: string; voiceLine?: string; breakdown?: ScoreBreakdown } }
  | { type: 'SET_FEEDBACK'; payload: { message: string; type: 'success' | 'error' | '' } }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_IS_TYPING'; payload: boolean }
  | { type: 'SET_OUT_OF_QUESTIONS'; payload: boolean }
  | { type: 'RESET_CONVERSATION'; payload: { initialMessage?: Message } }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'GIVE_UP' }
  | {
      type: 'START_DAILY';
      payload: {
        figure: HistoricFigure;
        dateKey: string;
        dayNumber: number;
        /** Set when today's puzzle was already finished: the round is restored as it ended. */
        priorResult?: { won: boolean; cluesUsed: number; score: number };
        /** Set when today's round was left unfinished: the clues and misses so far. */
        progress?: {
          revealedClues: Array<Clue & { isAdaptive?: boolean }>;
          consecutiveMisses: number;
          adaptiveNotice?: string;
        };
      };
    };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME':
      return {
        ...state,
        shuffledFigures: action.payload.figures,
        currentFigureIndex: 0,
        revealedClues: [],
        consecutiveMisses: 0,
        score: 0,
        round: 1,
        gameEnded: false,
        feedbackMessage: '',
        feedbackType: '',
        isRevealed: false,
        inputDisabled: false,
        showNextButton: false,
        personaLine: '',
        messages: [],
        questionsAsked: 0,
        adaptiveHintNotice: '',
        outOfQuestions: false,
        playKind: 'practice',
        daily: null,
        roundOutcome: null,
      };

    case 'START_GAME':
      return {
        ...state,
        showWelcome: false,
      };

    case 'RESTART_GAME':
      return {
        ...initialState,
        shuffledFigures: action.payload.figures,
        showWelcome: false, // Don't show welcome modal on restart
        llmMode: action.payload.mode ? action.payload.mode === 'ai' : state.llmMode, // Keep the mode unless a switch was requested
        aiStatus: state.aiStatus,
      };

    case 'SET_MODE':
      return {
        ...state,
        llmMode: action.payload.mode === 'ai',
        messages: [],
        questionsAsked: 0,
        isTyping: false,
        outOfQuestions: false,
        feedbackMessage: '',
        feedbackType: '',
      };

    case 'SET_AI_STATUS': {
      const aiStatus = action.payload.available ? 'available' : 'unavailable';
      if (action.payload.available || !state.llmMode) {
        return { ...state, aiStatus };
      }
      // AI mode was selected but the server cannot serve it: fall back to Classic.
      return {
        ...state,
        aiStatus,
        llmMode: false,
        messages: [],
        questionsAsked: 0,
        isTyping: false,
        outOfQuestions: false,
        feedbackMessage: 'AI mode is not available right now, so you are playing Classic mode.',
        feedbackType: 'error',
      };
    }

    case 'NEXT_FIGURE': {
      const nextIndex = state.currentFigureIndex + 1;
      if (nextIndex >= state.shuffledFigures.length) {
        return { ...state, gameEnded: true };
      }
      return {
        ...state,
        currentFigureIndex: nextIndex,
        round: state.round + 1,
        feedbackMessage: '',
        feedbackType: '',
        personaLine: '',
        isRevealed: false,
        inputDisabled: false,
        showNextButton: false,
        messages: [],
        questionsAsked: 0,
        revealedClues: [],
        consecutiveMisses: 0,
        adaptiveHintNotice: '',
        outOfQuestions: false,
        roundOutcome: null,
      };
    }

    case 'TOGGLE_DOCS':
      return { ...state, showDocs: action.payload };

    case 'REVEAL_CLUE':
      return {
        ...state,
        revealedClues: [...state.revealedClues, { ...action.payload.clue, isAdaptive: action.payload.isAdaptive }],
        adaptiveHintNotice: action.payload.adaptiveNotice || state.adaptiveHintNotice,
      };

    case 'REGISTER_MISS':
      return {
        ...state,
        consecutiveMisses: state.consecutiveMisses + 1,
        feedbackMessage: action.payload.feedback,
        feedbackType: 'error',
        triggerShake: action.payload.triggerShake ?? false,
      };

    case 'CORRECT_GUESS':
      return {
        ...state,
        score: state.score + action.payload.scoreDelta,
        feedbackMessage: action.payload.feedback,
        feedbackType: 'success',
        personaLine: action.payload.voiceLine || '',
        isRevealed: true,
        inputDisabled: true,
        showNextButton: true,
        consecutiveMisses: 0,
        adaptiveHintNotice: '',
        outOfQuestions: false, // Reset this just in case
        lastRoundBreakdown: action.payload.breakdown ?? state.lastRoundBreakdown,
        lastRoundNumber: action.payload.breakdown ? state.round : state.lastRoundNumber,
        roundOutcome: 'won',
      };

    case 'SET_FEEDBACK':
      return {
        ...state,
        feedbackMessage: action.payload.message,
        feedbackType: action.payload.type,
      };

    case 'CLEAR_SHAKE':
      return { ...state, triggerShake: false };

    case 'ADD_MESSAGE': {
      const newMessages = [...state.messages, action.payload];
      const newQuestionsAsked = action.payload.role === 'user' ? state.questionsAsked + 1 : state.questionsAsked;
      return {
        ...state,
        messages: newMessages,
        questionsAsked: newQuestionsAsked,
      };
    }

    case 'SET_IS_TYPING':
      return { ...state, isTyping: action.payload };

    case 'SET_OUT_OF_QUESTIONS':
      return { ...state, outOfQuestions: action.payload };

    case 'RESET_CONVERSATION':
      return {
        ...state,
        messages: action.payload.initialMessage ? [action.payload.initialMessage] : [],
        questionsAsked: 0,
        feedbackMessage: '',
        feedbackType: '',
        outOfQuestions: false,
      };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'GIVE_UP': {
      const currentFigure = state.shuffledFigures[state.currentFigureIndex];
      return {
        ...state,
        isRevealed: true,
        inputDisabled: true,
        showNextButton: true,
        feedbackMessage: `You gave up. The answer was ${currentFigure.name}. This round is over—you can't ask more questions for this figure.`,
        feedbackType: 'error',
        consecutiveMisses: 0,
        adaptiveHintNotice: '',
        outOfQuestions: false,
        roundOutcome: 'gave_up',
      };
    }

    case 'START_DAILY': {
      const { figure, dateKey, dayNumber, priorResult, progress } = action.payload;
      const fresh: GameState = {
        ...initialState,
        shuffledFigures: [figure],
        showWelcome: false,
        llmMode: state.llmMode, // The practice preference survives; the hook applies Classic rules while daily runs.
        aiStatus: state.aiStatus,
        playKind: 'daily',
        daily: { dateKey, dayNumber },
      };
      if (!priorResult) {
        // Left unfinished earlier today: pick up with the same clues and misses.
        if (progress && progress.revealedClues.length > 0) {
          return {
            ...fresh,
            revealedClues: progress.revealedClues,
            consecutiveMisses: progress.consecutiveMisses,
            adaptiveHintNotice: progress.adaptiveNotice ?? '',
          };
        }
        return fresh;
      }

      // Already played today: show the round as it ended, with no way to play it again.
      const cluesUsed = Math.min(Math.max(priorResult.cluesUsed, 1), figure.clues.length);
      return {
        ...fresh,
        revealedClues: figure.clues.slice(0, cluesUsed),
        score: priorResult.score,
        isRevealed: true,
        inputDisabled: true,
        showNextButton: true,
        roundOutcome: priorResult.won ? 'won' : 'gave_up',
        feedbackMessage: priorResult.won
          ? `You already solved today's puzzle: it was ${figure.name}. Come back tomorrow for a new one.`
          : `You already played today's puzzle. The answer was ${figure.name}. Come back tomorrow for a new one.`,
        feedbackType: priorResult.won ? 'success' : 'error',
      };
    }

    default:
      return state;
  }
}
