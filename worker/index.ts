import { getFigureById } from '../src/data/figuresConfig';
import {
  FALLBACK_GREETING,
  MAX_HINT_LEVEL,
  MAX_HISTORY_MESSAGES,
  MAX_RESPONSE_TOKENS,
  buildConversationMessages,
  buildGreetingMessages,
  buildValidationMessages,
  fallbackValidation,
  parseValidationResult,
  type AiChatRequest,
  type AiChatResponse,
  type AiErrorResponse,
  type AiStatusResponse,
  type ChatMessage,
  type ModelMessage,
} from '../src/services/llmPrompts';

/**
 * AI proxy for the game.
 *
 * The browser never sees the OpenAI key: it sends a figure id plus the
 * conversation so far, and this Worker builds the prompts from its own copy
 * of the figure data. Requests are rate limited per client IP.
 */

const MAX_MESSAGE_CHARS = 2000;
const MAX_GUESS_CHARS = 120;
const MAX_FIGURE_ID_CHARS = 100;
const UPSTREAM_TIMEOUT_MS = 20_000;

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/ai/status') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return json<AiStatusResponse>({
        available: isConfigured(env),
        model: env.OPENAI_MODEL,
      });
    }

    if (url.pathname === '/api/ai/chat') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return handleChat(request, env);
    }

    return error('not_found', 404);
  },
} satisfies ExportedHandler<Env>;

async function handleChat(request: Request, env: Env): Promise<Response> {
  if (!isConfigured(env)) return error('ai_unavailable', 503);
  if (!isSameSite(request)) return error('forbidden', 403);
  if (await isRateLimited(request, env)) return error('rate_limited', 429, { 'retry-after': '60' });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return error('invalid_json', 400);
  }

  const parsed = parseRequest(payload);
  if (!parsed.ok) return error(parsed.error, 400);

  const chatRequest = parsed.value;
  const figure = getFigureById(chatRequest.figureId);
  if (!figure) return error('unknown_figure', 400);

  try {
    if (chatRequest.op === 'greeting') {
      const content = await complete(env, buildGreetingMessages(figure), { maxTokens: 200, temperature: 0.9 });
      return json<AiChatResponse>({ op: 'greeting', content: content ?? FALLBACK_GREETING });
    }

    if (chatRequest.op === 'message') {
      const messages = buildConversationMessages(figure, chatRequest.history, chatRequest.hintLevel);
      const content = await complete(env, messages, { maxTokens: MAX_RESPONSE_TOKENS, temperature: 0.8 });
      if (!content) return error('empty_response', 502);
      return json<AiChatResponse>({ op: 'message', content });
    }

    const messages = buildValidationMessages(chatRequest.guess, figure, chatRequest.history);
    const text = await complete(env, messages, { maxTokens: 150, temperature: 0.3, json: true });
    const result = (text ? parseValidationResult(text) : null) ?? fallbackValidation(chatRequest.guess, figure);
    return json<AiChatResponse>({ op: 'validate', result });
  } catch (cause) {
    console.error(JSON.stringify({
      message: 'upstream request failed',
      op: chatRequest.op,
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    return error('upstream_error', 502);
  }
}

function isConfigured(env: Env): boolean {
  return typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.length > 0;
}

/**
 * Browsers send Sec-Fetch-Site on every request. Anything other than a
 * same-origin call (or a client that does not send the header) is refused,
 * which stops other websites from using this proxy from their pages.
 */
function isSameSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site === null || site === 'same-origin' || site === 'none';
}

async function isRateLimited(request: Request, env: Env): Promise<boolean> {
  const limiter = env.AI_RATE_LIMITER;
  if (!limiter) return false;

  const key = request.headers.get('cf-connecting-ip') ?? 'unknown';
  try {
    const { success } = await limiter.limit({ key });
    return !success;
  } catch (cause) {
    // Failing open keeps the game playable; the OpenAI spend cap is the backstop.
    console.error(JSON.stringify({
      message: 'rate limiter unavailable',
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    return false;
  }
}

type ParsedRequest = { ok: true; value: AiChatRequest } | { ok: false; error: string };

function parseRequest(input: unknown): ParsedRequest {
  if (!isRecord(input)) return { ok: false, error: 'invalid_body' };

  const { op, figureId } = input;
  if (typeof figureId !== 'string' || figureId.length === 0 || figureId.length > MAX_FIGURE_ID_CHARS) {
    return { ok: false, error: 'invalid_figure' };
  }

  if (op === 'greeting') {
    return { ok: true, value: { op, figureId } };
  }

  if (op === 'message') {
    const history = parseHistory(input.history);
    if (!history || history.length === 0 || history[history.length - 1].role !== 'user') {
      return { ok: false, error: 'invalid_history' };
    }
    const hintLevel = typeof input.hintLevel === 'number' && Number.isInteger(input.hintLevel)
      ? Math.min(MAX_HINT_LEVEL, Math.max(1, input.hintLevel))
      : 1;
    return { ok: true, value: { op, figureId, history, hintLevel } };
  }

  if (op === 'validate') {
    const guess = typeof input.guess === 'string' ? input.guess.trim() : '';
    if (!guess || guess.length > MAX_GUESS_CHARS) return { ok: false, error: 'invalid_guess' };
    const history = parseHistory(input.history);
    if (!history) return { ok: false, error: 'invalid_history' };
    return { ok: true, value: { op, figureId, guess, history } };
  }

  return { ok: false, error: 'unsupported_op' };
}

function parseHistory(raw: unknown): ChatMessage[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;

  const messages: ChatMessage[] = [];
  for (const item of raw.slice(-MAX_HISTORY_MESSAGES)) {
    if (!isRecord(item)) return null;
    if (item.role !== 'user' && item.role !== 'assistant') return null;
    if (typeof item.content !== 'string') return null;
    const content = item.content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (content) messages.push({ role: item.role, content });
  }
  return messages;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface CompletionOptions {
  maxTokens: number;
  temperature: number;
  json?: boolean;
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string | null } }>;
}

async function complete(env: Env, messages: ModelMessage[], options: CompletionOptions): Promise<string | null> {
  const baseUrl = env.OPENAI_BASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(`OpenAI responded ${response.status}: ${detail}`);
  }

  const completion = (await response.json()) as ChatCompletion;
  const content = completion.choices?.[0]?.message?.content?.trim();
  return content ? content : null;
}

function json<T>(body: T, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

function error(code: string, status: number, headers: Record<string, string> = {}): Response {
  return json<AiErrorResponse>({ error: code }, status, headers);
}

function methodNotAllowed(allowed: string): Response {
  return error('method_not_allowed', 405, { allow: allowed });
}
