# Who Am I? 🎭

A React-based guessing game where players identify historic figures either through sequential clues (Classic Mode) or an in-character conversation with an AI-powered historic figure (AI Mode). The UI keeps a clean, minimalist design with a strict navy-and-white color scheme.

The app deploys to Cloudflare Workers: the React build is served as static assets and a small Worker at `/api/ai/*` talks to OpenAI, so the API key never reaches the browser.

## 🎮 How to Play

Pick the daily puzzle or a practice mode on the welcome screen. In practice, the toggle in the header switches between Classic and AI; switching mid-game starts a new game, because the two modes score rounds differently.

### Classic Mode (Clues)

1. A silhouette of a historic figure appears
2. Read the first clue (automatically revealed)
3. Either guess immediately or reveal more clues
4. Type your guess and hit Enter
5. Earn points based on how few clues you needed:
   - 1 clue = 100 points
   - 2 clues = 90 points
   - 3 clues = 80 points
   - 4 clues = 70 points
   - 5 clues = 60 points
   - Every consecutive wrong guess deducts 5 points
   - Classic rounds never drop below 50 points

### AI Mode (Conversation)

1. A historic figure greets you mysteriously in character
2. Ask free-form questions to learn about their life, era, and work
3. The figure responds in character, giving progressively more specific hints
4. You can ask up to 15 questions per conversation before starting a new chat
5. When you think you know who it is, type your guess and submit it
6. Scoring is based on how many questions you asked and how many consecutive misses you had:
   - Each question or adaptive hint: -5 points
   - Each consecutive wrong guess: -5 points
   - AI conversations never drop below 25 points

AI Mode is only offered when the server has an OpenAI key configured. Without one the mode switch is hidden and the game runs in Classic Mode.

### Daily Puzzle

One figure per UTC calendar day, the same for everyone, played under Classic rules with a single attempt. Pick **Daily** on the welcome screen or in the header; **Practice** takes you back to the endless game.

- The figure is chosen deterministically from the roster by `selectDailyFigure` in `src/utils/gameUtils.ts`: days are grouped into cycles, each a seeded shuffle of the figures whose `dailyFrom` date had arrived when the cycle began, so no figure repeats until every other one has had its day. A roster change never touches a cycle in progress: new figures wait for the next cycle, and a disabled figure's days go to a stand-in. No server is involved, so every device agrees. Puzzle #1 is `DAILY_EPOCH` (2026-11-04).
- When the round ends you get a result panel with a Wordle-style grid (one square per clue revealed, a tick for a solve or a cross for a give-up), the score, the puzzle number and the site URL. **Share** uses the Web Share sheet where the browser has one, **Copy result** uses the clipboard, and if both are blocked the text appears in a box to copy by hand.
- Stats live in `localStorage` under the versioned key `guessme:daily-stats:v1`: games played, win rate, current and best streak, and how many clues your wins needed. Open them from the header or the result panel.
- An unfinished round is saved in the browser too (`guessme:daily-progress:v1`), so a reload or a detour into practice resumes it with the same clues and misses.
- When the server has an OpenAI key, the result panel offers **Ask {first name} anything**: three questions a day to the figure, who now answers openly in the first person. The count is kept with the day's result, so a reload does not reset it.
- A finished puzzle cannot be replayed: reopening it shows the result and a countdown to the next puzzle at midnight UTC.

The game includes diverse historic figures from science, arts, politics, and culture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure local secrets (optional, needed for AI Mode)
cp .env.example .env.local
# Edit .env.local and set OPENAI_API_KEY

# Start the development server (React app + Worker API on one origin)
npm run dev

# Open http://localhost:5173 in your browser
```

`npm run dev` runs the Worker in the Cloudflare Workers runtime locally through the Cloudflare Vite plugin, so `/api/ai/*` works in development exactly as it does in production. See [LLM_SETUP.md](LLM_SETUP.md) for details on AI Mode and deployment.

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Lightning-fast build tool with hot module replacement
- **Cloudflare Workers** - Static asset hosting plus the AI proxy, configured in `wrangler.jsonc`
- **Vitest** - Unit tests for the reducer, figure data and the Worker
- **CSS Custom Properties** - Design tokens for consistent styling
- **Custom Fonts** - BST Spyre Book, Every Regular, Untitled Sans

## 📁 Project Structure

```
guessme/
├── src/
│   ├── components/              # React UI components
│   │   ├── Header.tsx           # Title, mode toggle, docs button
│   │   ├── CharacterSilhouette.tsx
│   │   ├── CluesList.tsx
│   │   ├── ConversationView.tsx # Chat-style UI for AI Mode
│   │   ├── GuessInput.tsx
│   │   ├── FeedbackMessage.tsx
│   │   ├── GameOverModal.tsx
│   │   ├── DailyResult.tsx      # Shareable daily result + countdown
│   │   ├── DailyAskPanel.tsx    # Three questions to today's figure after the reveal
│   │   ├── DailyStatsModal.tsx  # Played, win rate, streaks, clue distribution
│   │   ├── WelcomeModal.tsx     # Intro + Daily / Classic / AI picker
│   │   ├── DocumentationModal.tsx # "How to play" overlay
│   │   ├── Toggle.tsx
│   │   └── Footer.tsx
│   ├── data/
│   │   └── figuresConfig.ts     # Figure roster (shared with the Worker)
│   ├── hooks/
│   │   └── useGame.ts           # Central game state + actions
│   ├── reducers/
│   │   └── gameReducer.ts       # Reducer backing useGame
│   ├── services/
│   │   ├── llmService.ts        # Browser client for /api/ai/*
│   │   ├── llmPrompts.ts        # Prompt builders + API contract (shared with the Worker)
│   │   ├── gameMode.ts          # Default mode + remembered choice
│   │   ├── dailyStats.ts        # Daily stats in localStorage (versioned key)
│   │   └── analytics.ts         # Optional PostHog events
│   ├── utils/
│   │   └── gameUtils.ts         # Scoring, shuffling, fuzzy matching, daily figure selection
│   ├── types.ts                 # TypeScript interfaces
│   ├── App.tsx                  # App shell + layout using useGame
│   ├── App.css                  # Styles and design tokens
│   └── main.tsx                 # React entry point
├── worker/
│   ├── index.ts                 # Cloudflare Worker: AI proxy with rate limiting
│   └── index.test.ts
├── public/                      # Static assets (fonts, link preview image + its SVG source)
├── index.html
├── wrangler.jsonc               # Worker, assets, bindings and secrets config
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

## 🎨 Design Philosophy

The game uses a strict two-color palette (navy `#001f3f` and white `#ffffff`) with interactive hover states that invert colors. Typography features custom font loading with fallbacks, and the responsive layout adapts gracefully to mobile screens.

### Link previews

`index.html` carries Open Graph and Twitter Card tags, so a pasted guessme.world link, such as the last line of a shared daily result, shows a card with `public/og-image.png`. That 1200×630 image is rendered from `public/og-image.svg` in the game's font and palette. After editing the SVG, re-render the PNG from the repo root with Chrome or Chromium (this is the macOS path; elsewhere use `google-chrome` or `chromium`):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=4000 \
  --screenshot="$PWD/public/og-image.png" "file://$PWD/public/og-image.svg"
```

Look at the result at about 300px wide, the size most chat apps show it. Apps cache previews, often for days, so when the image changes, also change its URL in `index.html` (for example `og-image.png?v=2`).

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload (app + Worker)

# Production
npm run build        # Type-check and build the client and the Worker
npm run preview      # Run the production build locally in the Workers runtime
npm run deploy       # Build and deploy to Cloudflare

# Code Quality
npm run lint         # Run ESLint on codebase
npm run typecheck    # Regenerate Worker types and type-check all projects
npm test             # Run the Vitest suite (add --run for a single pass)
```

## 🧩 Adding New Historic Figures

Edit `src/data/figuresConfig.ts` and add to the end of the `allFigures` array:

```typescript
{
  enabled: true,
  dailyFrom: '2027-01-15',  // The day this ships, or later
  name: "Marie Curie",
  alternateNames: ["curie", "marie", "marie curie", "marie sklodowska-curie"],
  eraTags: ["Industrial Age", "Chemistry"],
  voiceLine: "Nothing in life is to be feared—it is only to be understood. Onward?",
  clues: [
    { text: "I was born in Poland in 1867.", difficulty: 'hard' },
    { text: "I was the first woman to win a Nobel Prize.", difficulty: 'medium' },
    { text: "I won Nobel Prizes in both Physics and Chemistry.", difficulty: 'medium' },
    { text: "I discovered the elements polonium and radium.", difficulty: 'easy' },
    { text: "My research on radioactivity revolutionized science and medicine.", difficulty: 'easy' }
  ]
}
```

**Requirements:**
- Exactly 5 clues, ordered from vague to specific, each tagged `hard`, `medium` or `easy`
- Include common name variations in `alternateNames` (lowercase)
- Set `dailyFrom` to the day the figure ships, or later, so today's daily puzzle stays put
- TypeScript will validate the structure automatically, and `npm test` checks every figure has five clues and a unique id

See [FIGURES.md](FIGURES.md) for the full guide.

## 🎯 Game Mechanics

**State Management:** A `useReducer`-based store in `src/reducers/gameReducer.ts`, wrapped by the `useGame` hook, manages round progression, scoring, figure randomization, the active mode and the AI conversation.

**Guess Validation:** Classic Mode matches case-insensitively against the canonical name and alternate names with fuzzy matching for typos. AI Mode asks the model to grade the guess and falls back to exact matching if the model is unavailable.

**Scoring System:** Points decrease by 10 for each additional clue revealed. Every consecutive wrong guess deducts 5 points, but Classic rounds never drop below 50 points.

## 🤖 AI Mode and Deployment

The browser never holds an API key. `src/services/llmService.ts` calls `/api/ai/status` and `/api/ai/chat`; `worker/index.ts` builds the prompts from its own copy of the figure data, calls OpenAI, and rate limits requests per client IP.

- Locally, set `OPENAI_API_KEY` in `.env.local` and run `npm run dev`.
- In production, set the secret once with `npx wrangler secret put OPENAI_API_KEY` and deploy with `npm run deploy`. Deploys fail until the secret exists.
- The model and base URL are plain config in `wrangler.jsonc` (`vars`). Point `OPENAI_BASE_URL` at a Cloudflare AI Gateway to add caching, logs and spend limits without code changes.

Set a monthly spend cap in your OpenAI account as the hard backstop.

## 📈 Analytics

Set `VITE_POSTHOG_KEY` (and optionally `VITE_POSTHOG_HOST`) to send gameplay events to PostHog in cookieless mode. Without a key, events are logged to the console in development and dropped in production. Events include game started, round completed, clue revealed, question asked, guess incorrect, gave up, game completed and mode changed, plus `daily_started`, `daily_completed` (won, clues used, score), `share_clicked` (share sheet, clipboard or manual copy), `daily_ask_opened`, `daily_ask_question` (count) and `daily_ask_limit_reached` for the daily puzzle.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional historic figures from diverse backgrounds
- Accessibility enhancements (ARIA labels, keyboard navigation)
- Sound effects and animations
- Multiplayer mode
- Difficulty levels with varying point values

## 📄 License

MIT

## 🙏 Acknowledgments

Built with modern web technologies and a love for history.
