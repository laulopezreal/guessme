# AI Mode Setup

AI Mode lets players interrogate a historic figure who answers in character. The model calls run in a Cloudflare Worker (`worker/index.ts`), never in the browser, so the OpenAI key is a server-side secret.

## How requests flow

```
Browser (src/services/llmService.ts)
   │  POST /api/ai/chat { op, figureId, history, hintLevel | guess }
   ▼
Cloudflare Worker (worker/index.ts)
   │  checks key, same-origin header and per-IP rate limit
   │  builds prompts from src/data/figuresConfig.ts + src/services/llmPrompts.ts
   ▼
OpenAI chat completions (model and base URL from wrangler.jsonc "vars")
```

Operations:

| `op` | Purpose | Response |
|---|---|---|
| `greeting` | Opening line plus a two-line poem | `{ op, content }` |
| `message` | One conversational turn, history trimmed to the last 12 messages | `{ op, content }` |
| `validate` | Grade a guess, JSON-only answer with exact-match fallback | `{ op, result: { isCorrect, confidence, feedback } }` |
| `converse` | One turn of the open chat after the daily reveal: the figure answers as themselves, history trimmed to the last 12 messages | `{ op, content }` |

`GET /api/ai/status` returns `{ available, model }` so the app can disable the AI toggle when no key is configured.

Errors come back as `{ error }` with a status code: `503 ai_unavailable`, `429 rate_limited`, `400` for bad input, `502 upstream_error`.

## Local development

1. Get an OpenAI API key from https://platform.openai.com/api-keys and set a monthly spend limit on the account.
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. The file is gitignored.
3. Run `npm run dev`. The Cloudflare Vite plugin runs the Worker locally and passes `OPENAI_API_KEY` from `.env.local` to it. The browser bundle never sees it: only keys prefixed `VITE_` reach the client.
4. Open the game. The header shows the mode toggle; pick AI Mode on the welcome screen or flip the toggle.

Without a key, `/api/ai/status` reports `available: false`, the mode switch is hidden and the game runs in Classic Mode. If you set `VITE_GAME_MODE=ai` the app still falls back to Classic Mode in that case and tells the player why.

## Production

```bash
npx wrangler login
npx wrangler secret put OPENAI_API_KEY   # prompts for the value, never pass it as an argument
npm run deploy                           # builds, then wrangler deploy
```

`wrangler.jsonc` declares `OPENAI_API_KEY` under `secrets.required`, so a deploy fails with a clear message until the secret exists.

Non-secret settings live in `wrangler.jsonc`:

- `vars.OPENAI_MODEL`, default `gpt-4o-mini`
- `vars.OPENAI_BASE_URL`, default `https://api.openai.com/v1`. Point it at a [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) URL to get request logs, caching and gateway-level rate limits without code changes.
- `ratelimits`: 30 requests per minute per client IP for the AI endpoints. Limits are approximate and per Cloudflare location.
- `observability`: Workers Logs and Traces are enabled; the Worker logs structured JSON on upstream failures.

## Cost

With `gpt-4o-mini` at $0.15 per 1M input tokens and $0.60 per 1M output tokens, a full 15-question round costs roughly $0.003 and a complete game under $0.02. The 15-question limit per conversation and the per-IP rate limit bound the cost per player; the OpenAI spend cap bounds the total.

## Testing

`npm test` runs `worker/index.test.ts`, which exercises the Worker against a mocked OpenAI endpoint: configuration checks, same-origin enforcement, rate limiting, input validation, history trimming, guess grading and upstream failures. The prompt builders are pure functions in `src/services/llmPrompts.ts`.

## Troubleshooting

**No mode switch in the header**
- Check `.env.local` contains `OPENAI_API_KEY` and restart `npm run dev`
- In production, confirm the secret exists: `npx wrangler secret list`

**"The AI did not answer"**
- Check the Worker logs (`npx wrangler tail` or the Cloudflare dashboard) for the upstream status code
- Verify the OpenAI account has credit

**"You are asking faster than the AI can keep up"**
- The per-IP rate limit was hit. Adjust `ratelimits` in `wrangler.jsonc` if the limit is too tight for shared networks.
