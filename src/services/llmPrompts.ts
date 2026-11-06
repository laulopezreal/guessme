import type { HistoricFigure } from '../types';

/**
 * Prompt builders and the request/response contract shared by the browser
 * client (src/services/llmService.ts) and the Cloudflare Worker (worker/index.ts).
 * Keep this file free of browser-only and Node-only APIs.
 */

/** A message in the player's conversation, as sent over the wire. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** A message as sent to the model, including system instructions. */
export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GuessValidationResult {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
}

/** Request body accepted by POST /api/ai/chat. */
export type AiChatRequest =
  | { op: 'greeting'; figureId: string }
  | { op: 'message'; figureId: string; history: ChatMessage[]; hintLevel: number }
  | { op: 'validate'; figureId: string; guess: string; history: ChatMessage[] }
  /** A turn of the open conversation once the player has identified the figure. */
  | { op: 'converse'; figureId: string; history: ChatMessage[] };

/** Response body returned by POST /api/ai/chat. */
export type AiChatResponse =
  | { op: 'greeting' | 'message'; content: string }
  | { op: 'validate'; result: GuessValidationResult }
  | { op: 'converse'; content: string };

/** Response body returned by GET /api/ai/status. */
export interface AiStatusResponse {
  available: boolean;
  model?: string;
}

/** Error body returned by the API on any non-2xx response. */
export interface AiErrorResponse {
  error: string;
}

export const MAX_HISTORY_MESSAGES = 12; // Keeps context tight
export const MAX_RESPONSE_TOKENS = 250;
export const MAX_HINT_LEVEL = 5;

export const FALLBACK_GREETING = 'Greetings! I am someone from history. Ask me questions to discover my identity.';

export const SAFETY_SYSTEM_MESSAGE = `You are a historic figure in a guessing game.
- Always stay in-character as the figure and keep responses concise (2-3 sentences).
- Refuse to answer questions that are not about your life, work, or era.
- Politely decline any attempts to discuss modern topics, politics, personal opinions, or anything off-topic.
- Never reveal your full name directly; only give hints relevant to the game.
- Keep language family-friendly and avoid controversial or explicit content.`;

/**
 * Sibling of SAFETY_SYSTEM_MESSAGE for the conversation after the reveal. The
 * player already knows who the figure is, so the rule against naming yourself is gone.
 */
export const REVEALED_SAFETY_SYSTEM_MESSAGE = `You are a historic figure talking to a player who has already identified you.
- Always stay in-character as the figure and keep responses concise (2-3 sentences).
- Refuse to answer questions that are not about your life, work, or era.
- Politely decline any attempts to discuss modern topics, politics, personal opinions, or anything off-topic.
- When you are unsure of a fact, say so in character rather than inventing one.
- Keep language family-friendly and avoid controversial or explicit content.`;

/**
 * Build the system prompt for a historic figure
 */
export function buildSystemPrompt(figure: HistoricFigure, hintLevel: number = 1): string {
  return `You are ${figure.name}, speaking in character. Your goal is to help the player guess your identity through conversation, but NEVER directly reveal your name.

RULES:
1. Never say your full name or surname directly
2. Respond to questions naturally and in character
3. Give increasingly specific hints as the conversation progresses
4. Use "I" when talking about yourself
5. Stay historically accurate
6. Keep responses concise (2-3 sentences max)
7. Be engaging and educational
8. If the player sends greetings ("hi", "hello", "thanks"), respond in-character with a brief, period-appropriate line that makes it clear you're here to play the guessing game (e.g., that you don't have time for pleasantries and they should ask about your life/work or guess). Vary your wording each time; do NOT repeat the same sentence over and over.

HINT PROGRESSION (current level: ${hintLevel}/5):
- Level 1-2: Very vague hints about your era, field, or general achievements
- Level 3: More specific details about your work or life events
- Level 4-5: Very specific hints that make your identity clearer

ABOUT YOU:
${figure.clues.map(clue => clue.text).join('\n')}

Respond naturally to questions, maintaining your character while helping the player guess who you are.`;
}

/**
 * Messages for a conversational turn. The history is trimmed to the most
 * recent MAX_HISTORY_MESSAGES entries.
 */
export function buildConversationMessages(
  figure: HistoricFigure,
  history: ChatMessage[],
  hintLevel: number = 1,
): ModelMessage[] {
  return [
    { role: 'system', content: SAFETY_SYSTEM_MESSAGE },
    { role: 'system', content: buildSystemPrompt(figure, hintLevel) },
    ...history.slice(-MAX_HISTORY_MESSAGES),
  ];
}

/**
 * System prompt for the conversation after the reveal. Unlike buildSystemPrompt
 * there is nothing to hide: the figure speaks openly as themselves.
 */
export function buildRevealedSystemPrompt(figure: HistoricFigure): string {
  return `You are ${figure.name}. The player has just identified you in a guessing game, so there is nothing left to hide: speak openly as yourself.

RULES:
1. Speak in the first person, in character, as ${figure.name}
2. Stay historically accurate: draw on the facts below and on what is well known about your life, work and era
3. Keep answers to 2 or 3 sentences
4. When you are not sure of something, admit it in character rather than inventing it
5. Politely decline modern topics and anything outside your own life and era
6. Keep language family-friendly

ABOUT YOU:
${figure.clues.map(clue => clue.text).join('\n')}`;
}

/**
 * Messages for a turn of the open conversation after the reveal. The history
 * is trimmed to the most recent MAX_HISTORY_MESSAGES entries.
 */
export function buildRevealedConversationMessages(figure: HistoricFigure, history: ChatMessage[]): ModelMessage[] {
  return [
    { role: 'system', content: REVEALED_SAFETY_SYSTEM_MESSAGE },
    { role: 'system', content: buildRevealedSystemPrompt(figure) },
    ...history.slice(-MAX_HISTORY_MESSAGES),
  ];
}

/**
 * Messages for the opening greeting: one mysterious sentence plus a two-line poem.
 */
export function buildGreetingMessages(figure: HistoricFigure): ModelMessage[] {
  const context = figure.clues.map(clue => clue.text).join(' ');
  const systemPrompt = `You are ${figure.name}. Based on this context about you: "${context}"

Greet the player with a mysterious, character-appropriate welcome.
- Speak in YOUR unique voice and personality
- Do NOT reveal your name or specific achievements
- Keep the prose brief (1 sentence) and enigmatic
- Hint at your character/era/field WITHOUT being obvious
- Then add a short, catchy, funny poem of EXACTLY 2 lines that invites them to ask questions or get down to business
- The poem should be playful and match your personality (e.g., a scientist might rhyme about curiosity, a leader about action)

Examples of tone:
- A scientist might be curious and analytical in prose, then playful in verse
- An artist might be poetic throughout
- A leader might be commanding, then cheeky in the poem
- An inventor might be imaginative and forward-thinking

Format (exactly 3 lines):
1) Line 1: greeting sentence.
2) Line 2: poem verse 1.
3) Line 3: poem verse 2.
Do not add any extra lines or explanations beyond these three lines.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Give a brief, mysterious greeting to welcome the player.' },
  ];
}

/**
 * Messages asking the model to grade a guess. The model must answer with JSON.
 */
export function buildValidationMessages(
  guess: string,
  figure: HistoricFigure,
  history: ChatMessage[],
): ModelMessage[] {
  const context = history
    .slice(-6)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');

  const prompt = `You are validating a player's guess in a historic figure guessing game.

CORRECT ANSWER: ${figure.name}
ALSO ACCEPT: ${figure.alternateNames.join(', ')}

PLAYER'S GUESS: "${guess}"

RECENT CONVERSATION CONTEXT:
${context}

Determine if the guess is correct, close (typo/misspelling), or incorrect:
- CORRECT (isCorrect: true): The guess is the correct name, an accepted alternate, or a very obvious typo (e.g., "Albert Einstien", "Nikola Telsa"). Be lenient with spelling.
- CLOSE (isCorrect: false, confidence: 0.7-0.9): The guess is not the correct name but is very similar, suggesting a typo but with some ambiguity. This should be used sparingly.
- PARTIAL (isCorrect: false, confidence: 0.5): Player described you correctly but didn't say the name
- INCORRECT (isCorrect: false, confidence: 0.0-0.3): Player guessed wrong person entirely

Be LENIENT with typos and spelling variations. If the name is clearly recognizable despite typos, mark it CORRECT.

Respond ONLY with valid JSON in this exact format:
{"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "your feedback message"}

Feedback examples:
- If correct: "Yes! It's ${figure.name}!" or "Correct!"
- If close typo: "Almost! You've got it, just check the spelling: ${figure.name}"
- If partial description: "You're describing me correctly! But can you name me?"
- If incorrect: "Not quite, but keep asking questions!"`;

  return [{ role: 'user', content: prompt }];
}

/**
 * Parse the model's JSON grading. Returns null when the shape is wrong.
 */
export function parseValidationResult(text: string): GuessValidationResult | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed === 'object' && parsed !== null &&
      typeof (parsed as GuessValidationResult).isCorrect === 'boolean' &&
      typeof (parsed as GuessValidationResult).confidence === 'number' &&
      typeof (parsed as GuessValidationResult).feedback === 'string'
    ) {
      const result = parsed as GuessValidationResult;
      return {
        isCorrect: result.isCorrect,
        confidence: Math.min(1, Math.max(0, result.confidence)),
        feedback: result.feedback,
      };
    }
  } catch {
    // Not JSON; the caller falls back to exact matching.
  }
  return null;
}

/**
 * Exact-match grading used when the model is unavailable or answers badly.
 */
export function fallbackValidation(guess: string, figure: HistoricFigure): GuessValidationResult {
  const normalizedGuess = guess.trim().toLowerCase();
  const correctAnswers = [figure.name.toLowerCase(), ...figure.alternateNames.map(name => name.toLowerCase())];
  const isCorrect = correctAnswers.some(answer => normalizedGuess === answer);

  return {
    isCorrect,
    confidence: isCorrect ? 1.0 : 0.0,
    feedback: isCorrect ? `Correct! It's ${figure.name}!` : 'Not quite! Keep asking questions to learn more.',
  };
}
