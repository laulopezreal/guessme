import type { HistoricFigure, Message } from '../types';
import { figureId } from '../data/figuresConfig';
import {
  FALLBACK_GREETING,
  fallbackValidation,
  type AiChatRequest,
  type AiChatResponse,
  type AiErrorResponse,
  type AiStatusResponse,
  type ChatMessage,
  type GuessValidationResult,
} from './llmPrompts';

export type { GuessValidationResult } from './llmPrompts';

/**
 * Browser client for the AI proxy in worker/index.ts.
 *
 * The browser never holds an API key. It sends the figure id and the
 * conversation so far to /api/ai/*, and the Worker talks to OpenAI.
 */

const STATUS_URL = '/api/ai/status';
const CHAT_URL = '/api/ai/chat';

type ConversationMessage = Pick<Message, 'role' | 'content'>;

export class AiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(`AI request failed (${status}): ${code}`);
    this.name = 'AiRequestError';
    this.code = code;
    this.status = status;
  }
}

/**
 * A player-facing explanation for a failed AI request.
 */
export function describeAiError(error: unknown): string {
  if (error instanceof AiRequestError) {
    switch (error.code) {
      case 'rate_limited':
        return 'You are asking faster than the AI can keep up. Wait a minute and try again.';
      case 'ai_unavailable':
        return 'AI mode is not available right now, so you are playing Classic mode.';
      case 'upstream_error':
      case 'empty_response':
        return 'The AI did not answer. Please try again.';
      default:
        return 'Something went wrong talking to the AI. Please try again.';
    }
  }
  return 'Could not reach the AI. Check your connection and try again.';
}

/**
 * Ask the server whether AI mode can be served.
 */
export async function fetchAiStatus(): Promise<AiStatusResponse> {
  try {
    const response = await fetch(STATUS_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) return { available: false };
    return (await response.json()) as AiStatusResponse;
  } catch {
    return { available: false };
  }
}

function toChatHistory(messages: ConversationMessage[]): ChatMessage[] {
  const history: ChatMessage[] = [];
  for (const message of messages) {
    if (message.role === 'user' || message.role === 'assistant') {
      history.push({ role: message.role, content: message.content });
    }
  }
  return history;
}

async function callChat(body: AiChatRequest): Promise<AiChatResponse> {
  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let code = 'request_failed';
    try {
      code = ((await response.json()) as AiErrorResponse).error ?? code;
    } catch {
      // Non-JSON error body; keep the generic code.
    }
    throw new AiRequestError(code, response.status);
  }

  return (await response.json()) as AiChatResponse;
}

function isBlockingError(error: unknown): boolean {
  return error instanceof AiRequestError && (error.code === 'ai_unavailable' || error.code === 'rate_limited');
}

/**
 * Send a message to the LLM and get a response
 */
export async function sendMessage(
  conversationHistory: ConversationMessage[],
  figure: HistoricFigure,
  hintLevel: number = 1
): Promise<string> {
  const result = await callChat({
    op: 'message',
    figureId: figureId(figure.name),
    history: toChatHistory(conversationHistory),
    hintLevel,
  });

  if (result.op !== 'message' || !result.content) {
    throw new AiRequestError('empty_response', 502);
  }
  return result.content;
}

/**
 * Get an initial greeting from the historic figure.
 * Falls back to a generic greeting on transient failures; throws when AI
 * mode is unavailable or rate limited so the UI can react.
 */
export async function getInitialGreeting(figure: HistoricFigure): Promise<string> {
  try {
    const result = await callChat({ op: 'greeting', figureId: figureId(figure.name) });
    return result.op === 'greeting' && result.content ? result.content : FALLBACK_GREETING;
  } catch (error) {
    if (isBlockingError(error)) throw error;
    console.error('AI greeting failed:', error);
    return FALLBACK_GREETING;
  }
}

/**
 * Validate a player's guess using the LLM.
 * Falls back to exact matching on transient failures; throws when AI mode
 * is unavailable or rate limited so the UI can react.
 */
export async function validateGuess(
  guess: string,
  figure: HistoricFigure,
  conversationHistory: ConversationMessage[]
): Promise<GuessValidationResult> {
  try {
    const result = await callChat({
      op: 'validate',
      figureId: figureId(figure.name),
      guess,
      history: toChatHistory(conversationHistory),
    });
    if (result.op === 'validate') return result.result;
    throw new AiRequestError('unexpected_response', 502);
  } catch (error) {
    if (isBlockingError(error)) throw error;
    console.error('Guess validation error:', error);
    return fallbackValidation(guess, figure);
  }
}
