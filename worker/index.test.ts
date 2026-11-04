// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { figureId } from '../src/data/figuresConfig';

const EINSTEIN = figureId('Albert Einstein');

// The handler is typed for incoming Workers requests; tests build plain Requests.
type IncomingRequest = Parameters<typeof worker.fetch>[0];
function call(request: Request, env: Env): Promise<Response> {
  return worker.fetch(request as IncomingRequest, env);
}

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-4o-mini',
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
    AI_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    ...overrides,
  };
}

function completion(content: string): Response {
  return Response.json({ choices: [{ message: { content } }] });
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://game.test/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const upstream = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function lastUpstreamBody(): Record<string, unknown> {
  const init = upstream.mock.calls.at(-1)?.[1];
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

beforeEach(() => {
  upstream.mockReset();
  upstream.mockResolvedValue(completion('Hello there'));
  vi.stubGlobal('fetch', upstream);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/ai/status', () => {
  it('reports availability based on the configured key', async () => {
    const ok = await call(new Request('https://game.test/api/ai/status'), makeEnv());
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ available: true, model: 'gpt-4o-mini' });

    const missing = await call(new Request('https://game.test/api/ai/status'), makeEnv({ OPENAI_API_KEY: '' }));
    expect(await missing.json()).toMatchObject({ available: false });
  });

  it('rejects other methods and unknown paths', async () => {
    const wrongMethod = await call(new Request('https://game.test/api/ai/status', { method: 'POST' }), makeEnv());
    expect(wrongMethod.status).toBe(405);

    const unknown = await call(new Request('https://game.test/api/nope'), makeEnv());
    expect(unknown.status).toBe(404);
  });
});

describe('POST /api/ai/chat guards', () => {
  it('returns 503 when no key is configured', async () => {
    const response = await call(post({ op: 'greeting', figureId: EINSTEIN }), makeEnv({ OPENAI_API_KEY: '' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'ai_unavailable' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('refuses cross-site browser requests', async () => {
    const response = await call(post({ op: 'greeting', figureId: EINSTEIN }, { 'sec-fetch-site': 'cross-site' }), makeEnv());
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('returns 429 when the rate limiter says no', async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const response = await call(post({ op: 'greeting', figureId: EINSTEIN }), makeEnv({ AI_RATE_LIMITER: { limit } }));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('rejects malformed bodies', async () => {
    expect((await call(post('{not json'), makeEnv())).status).toBe(400);
    expect((await call(post({ op: 'greeting', figureId: 'nobody' }), makeEnv())).status).toBe(400);
    expect((await call(post({ op: 'dance', figureId: EINSTEIN }), makeEnv())).status).toBe(400);
    expect((await call(post({ op: 'message', figureId: EINSTEIN, history: [] }), makeEnv())).status).toBe(400);
    expect((await call(post({ op: 'message', figureId: EINSTEIN, history: [{ role: 'system', content: 'x' }] }), makeEnv())).status).toBe(400);
    expect((await call(post({ op: 'validate', figureId: EINSTEIN, guess: '' }), makeEnv())).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});

describe('POST /api/ai/chat operations', () => {
  it('builds the greeting request server-side with the secret key', async () => {
    const response = await call(post({ op: 'greeting', figureId: EINSTEIN }), makeEnv());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ op: 'greeting', content: 'Hello there' });

    const [url, init] = upstream.mock.calls[0];
    expect(String(url)).toBe('https://api.openai.com/v1/chat/completions');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-key');
    const body = lastUpstreamBody();
    expect(body.model).toBe('gpt-4o-mini');
    const messages = body.messages as Array<{ role: string; content: string }>;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Albert Einstein');
  });

  it('trims history and clamps the hint level for conversation turns', async () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'assistant' : 'user',
      content: `turn ${i}`,
    }));
    const response = await call(post({ op: 'message', figureId: EINSTEIN, history, hintLevel: 99 }), makeEnv());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ op: 'message', content: 'Hello there' });

    const messages = lastUpstreamBody().messages as Array<{ role: string; content: string }>;
    const conversation = messages.filter(m => m.role !== 'system');
    expect(conversation).toHaveLength(12);
    expect(conversation.at(-1)).toEqual({ role: 'user', content: 'turn 19' });
    expect(messages[1].content).toContain('current level: 5/5');
  });

  it('returns the model grading for a guess', async () => {
    upstream.mockResolvedValue(completion('{"isCorrect": true, "confidence": 1, "feedback": "Correct!"}'));
    const response = await call(post({ op: 'validate', figureId: EINSTEIN, guess: 'Einstien', history: [] }), makeEnv());
    expect(await response.json()).toEqual({ op: 'validate', result: { isCorrect: true, confidence: 1, feedback: 'Correct!' } });
    expect(lastUpstreamBody().response_format).toEqual({ type: 'json_object' });
  });

  it('falls back to exact matching when the model answers badly', async () => {
    upstream.mockResolvedValue(completion('not json at all'));
    const response = await call(post({ op: 'validate', figureId: EINSTEIN, guess: 'einstein' }), makeEnv());
    expect(await response.json()).toMatchObject({ op: 'validate', result: { isCorrect: true } });
  });

  it('maps upstream failures to 502 without leaking details', async () => {
    upstream.mockResolvedValue(new Response('{"error": "boom"}', { status: 500 }));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await call(post({ op: 'greeting', figureId: EINSTEIN }), makeEnv());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'upstream_error' });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
