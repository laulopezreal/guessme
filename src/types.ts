export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface HistoricFigure {
  name: string;
  alternateNames: string[];
  clues: string[];
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
