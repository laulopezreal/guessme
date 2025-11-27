import type { HistoricFigure, Clue, Message } from '../types';
import { isLLMConfigured } from '../services/llmService';
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
  messages: Message[];
  questionsAsked: number;
  isTyping: boolean;
  outOfQuestions: boolean;

  // Scoring summary
  lastRoundBreakdown: ScoreBreakdown | null;
  lastRoundNumber: number | null;
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
  llmMode: isLLMConfigured(),
  messages: [],
  questionsAsked: 0,
  isTyping: false,
  outOfQuestions: false,
  lastRoundBreakdown: null,
  lastRoundNumber: null,
};

export type GameAction =
  | { type: 'INIT_GAME'; payload: { figures: HistoricFigure[] } }
  | { type: 'START_GAME' }
  | { type: 'RESTART_GAME'; payload: { figures: HistoricFigure[] } }
  | { type: 'NEXT_FIGURE' }
  | { type: 'SET_LLM_MODE'; payload: boolean }
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
  | { type: 'GIVE_UP' };

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
        llmMode: state.llmMode, // Preserve LLM mode preference
      };

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
      };
    }

    case 'SET_LLM_MODE':
      return { ...state, llmMode: action.payload };

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
      };
    }

    default:
      return state;
  }
}
