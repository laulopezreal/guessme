# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React + TypeScript guessing game called "Who Am I?" where players guess historic figures either from sequential clues (Classic Mode) or by interrogating an AI that answers in character (AI Mode). The app deploys to Cloudflare Workers: the React build is served as static assets and a Worker at `/api/ai/*` proxies OpenAI so the API key never reaches the browser.

**Tech Stack:**
- React 19 with TypeScript
- Vite (build tool and dev server) with the Cloudflare Vite plugin
- Cloudflare Workers (`worker/index.ts`, configured in `wrangler.jsonc`)
- Vitest for unit tests
- CSS with custom properties
- Custom fonts: BST Spyre Book, Every Regular, Untitled Sans (Medium/Regular)

## Development Commands

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `OPENAI_API_KEY`: Worker-side secret for AI Mode. Not prefixed with `VITE_`, so it never enters the client bundle.
- `VITE_GAME_MODE`: `classic` or `ai`, the mode new players start in (defaults to `classic`). Players switch at runtime with the header toggle.
- `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST`: optional analytics.

The model and API base URL are non-secret `vars` in `wrangler.jsonc`.

### Running the Project

```bash
# Development server: React app + Worker API on http://localhost:5173
npm run dev
```

### Building and Deploying

```bash
npm run build        # wrangler types && tsc -b && vite build
npm run preview      # Run the build locally in the Workers runtime
npm run deploy       # Build, then wrangler deploy
```

Before the first deploy: `npx wrangler login` and `npx wrangler secret put OPENAI_API_KEY`. Deploys fail until the secret exists.

### Linting and Type Checking

```bash
npm run lint         # ESLint (eslint.config.js)
npm run typecheck    # Regenerates worker-configuration.d.ts, then tsc -b
```

Re-run `npm run typegen` (or `typecheck`) after changing `wrangler.jsonc`; the generated `worker-configuration.d.ts` is gitignored.

### Testing

```bash
npm test             # Vitest in watch mode
npx vitest run       # Single pass
```

Suites: `src/reducers/gameReducer.test.ts` (state transitions, including the daily puzzle), `src/utils/gameUtils.test.ts` (daily figure selection, share text), `src/services/dailyStats.test.ts` and `src/services/dailyProgress.test.ts` (streaks, resume, localStorage), `src/data/figuresConfig.test.ts` (roster integrity, guess tokens), `worker/index.test.ts` (the proxy against a mocked OpenAI endpoint).

## Code Architecture

### File Structure
```
guessme/
├── public/                     # Static assets (fonts)
├── src/
│   ├── components/             # React components (Header has the mode toggle)
│   ├── data/
│   │   └── figuresConfig.ts    # Figure roster, shared with the Worker
│   ├── hooks/
│   │   └── useGame.ts          # Game logic hook: actions, AI calls, analytics events
│   ├── reducers/
│   │   └── gameReducer.ts      # Reducer: rounds, scoring, mode, conversation
│   ├── services/
│   │   ├── llmService.ts       # Browser client for /api/ai/*
│   │   ├── llmPrompts.ts       # Prompt builders + API contract, shared with the Worker
│   │   ├── gameMode.ts         # Default mode + remembered choice (localStorage)
│   │   └── analytics.ts        # track(event, props), PostHog when configured
│   ├── utils/
│   │   └── gameUtils.ts        # Scoring, shuffling, fuzzy matching, name tokens
│   ├── types.ts
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── worker/
│   ├── index.ts                # Cloudflare Worker: AI proxy with rate limiting
│   └── index.test.ts
├── wrangler.jsonc              # Worker name, assets, vars, secrets, rate limit, observability
├── vite.config.ts              # react() + cloudflare()
├── vitest.config.ts            # Tests without the Cloudflare plugin
├── eslint.config.js
└── tsconfig*.json              # app, node and worker projects
```

### Key Patterns

**Game State Management:**
- `gameReducer.ts` owns all state; `useGame.ts` wraps it with async actions (AI calls) and analytics events
- `llmMode` is runtime state. `SET_MODE` switches before a game starts; `RESTART_GAME` with a `mode` switches mid-game (a switch restarts because scoring differs)
- `aiStatus` comes from `GET /api/ai/status`; `SET_AI_STATUS` with `available: false` forces Classic Mode and explains why
- `playKind` is `practice` or `daily`. `START_DAILY` loads the one figure for today (`selectDailyFigure` in `gameUtils.ts`) and, when today is already finished, restores the round as it ended; the hook derives `llmMode` as false while daily runs so Classic rules apply. Stats are kept by `services/dailyStats.ts` and an unfinished round by `services/dailyProgress.ts`, both under versioned localStorage keys. After the round, while AI is available, the result panel offers three questions to the figure (`DAILY_ASK_*` actions, the `converse` op in the Worker); the count lives on the day's `DailyRecord`

**AI proxy contract (`src/services/llmPrompts.ts`):**
- `POST /api/ai/chat` with `{ op: 'greeting' | 'message' | 'validate', figureId, ... }`
- The Worker rebuilds prompts from `figuresConfig.ts`; the client never sends prompts or keys
- Errors are `{ error }` with 503 (no key), 429 (rate limited), 400 (bad input), 502 (upstream)

**Scoring System:**
- Classic: `Math.max(50, 100 - (cluesUsed - 1) * 10 - misses * 5)`
- AI: `Math.max(25, 100 - questions * 5 - misses * 5)`
- Both use `calculatePoints(inputs, weights)` in `gameUtils.ts`

**Design System (App.css):**
- Strictly two-color palette: navy (#001f3f) and white (#ffffff)
- CSS custom properties for spacing, typography, and transitions
- Mobile-responsive with breakpoint at 768px
- Interactive hover states with color inversion

### Game Flow

1. **Initialization** - `INIT_GAME` shuffles the enabled figures; `/api/ai/status` is fetched once
2. **Mode choice** - welcome modal picker or header toggle
3. **Clue Revelation** - `REVEAL_CLUE`, with adaptive easier clues after repeated misses
4. **Guess Validation** - fuzzy matching in Classic Mode, model grading in AI Mode
5. **Round Progression** - `NEXT_FIGURE`
6. **Game End** - modal appears when all figures are guessed

## Making Changes

### Adding New Historic Figures

Edit the `allFigures` array in `src/data/figuresConfig.ts`. See `FIGURES.md`. `npm test` checks every figure has five clues and a unique id.

### Modifying Scoring

Classic mode uses `classicScoreWeights` and AI mode uses `llmScoreWeights` in `src/utils/gameUtils.ts`. Update the weights there and the header breakdown plus documentation stay consistent.

### Changing the AI behaviour

Prompts live in `src/services/llmPrompts.ts` (pure functions, covered by the Worker tests). Rate limits, model and base URL live in `wrangler.jsonc`.

### Styling Updates

All styles are in `src/App.css` using CSS custom properties defined in `:root`. Maintain the strict navy/white color scheme and hover state inversions.

## Important Notes

- **Secrets**: anything prefixed `VITE_` is embedded in the public bundle. Server secrets use plain names and reach the Worker through `.env.local` locally and `wrangler secret put` in production
- **Type-only imports**: Use `import type` for TypeScript interfaces (required by `verbatimModuleSyntax`)
- **Shared modules**: `figuresConfig.ts` and `llmPrompts.ts` are bundled into the Worker; keep them free of DOM and Node APIs
- **Case-insensitive matching**: All guess validation converts to lowercase
- **Answer flexibility**: Always add common variations to `alternateNames` (e.g., "einstein" for "Albert Einstein")
- **Clue progression**: First clue auto-reveals when figure loads; remaining 4 require button clicks

## Migration Notes

The original vanilla JavaScript version has been preserved as:
- `index-vanilla.html` - Original HTML
- `script-vanilla.js` - Original JavaScript

These files are kept for reference but are not used by the React build.

## Next Steps

- A paid tier beyond the three free daily questions, metered in the Worker (KV or Durable Object counters) instead of the browser
- Grow the roster well beyond ten figures
