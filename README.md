# Who Am I? 🎭

A React-based guessing game where players identify historic figures either through sequential clues (Classic Mode) or an in-character conversation with an AI-powered historic figure (AI Mode). The UI keeps a clean, minimalist design with a strict navy-and-white color scheme.

The app deploys to Cloudflare Workers: the React build is served as static assets and a small Worker at `/api/ai/*` talks to OpenAI, so the API key never reaches the browser.

## 🎮 How to Play

Pick a mode on the welcome screen or with the toggle in the header. Switching modes mid-game starts a new game, because the two modes score rounds differently.

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
│   │   ├── WelcomeModal.tsx     # Intro + mode picker
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
│   │   └── analytics.ts         # Optional PostHog events
│   ├── utils/
│   │   └── gameUtils.ts         # Scoring, shuffling, fuzzy matching
│   ├── types.ts                 # TypeScript interfaces
│   ├── App.tsx                  # App shell + layout using useGame
│   ├── App.css                  # Styles and design tokens
│   └── main.tsx                 # React entry point
├── worker/
│   ├── index.ts                 # Cloudflare Worker: AI proxy with rate limiting
│   └── index.test.ts
├── public/                      # Static assets (fonts)
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

Edit `src/data/figuresConfig.ts` and add to the `allFigures` array:

```typescript
{
  enabled: true,
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

Set `VITE_POSTHOG_KEY` (and optionally `VITE_POSTHOG_HOST`) to send gameplay events to PostHog in cookieless mode. Without a key, events are logged to the console in development and dropped in production. Events include game started, round completed, clue revealed, question asked, guess incorrect, gave up, game completed and mode changed.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional historic figures from diverse backgrounds
- A daily puzzle with shareable results
- Accessibility enhancements (ARIA labels, keyboard navigation)
- Sound effects and animations
- Multiplayer mode
- Difficulty levels with varying point values

## 📄 License

MIT

## 🙏 Acknowledgments

Built with modern web technologies and a love for history.
