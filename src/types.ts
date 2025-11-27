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
