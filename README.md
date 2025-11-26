[![Netlify Status](https://api.netlify.com/api/v1/badges/cadeac1f-f7b5-4ed5-b2f3-d16228ca6317/deploy-status)](https://app.netlify.com/projects/guessmeyou/deploys)

# Who Am I? 🎭

A React-based guessing game where players identify historic figures either through sequential clues (Classic Mode) or an in-character conversation with an AI-powered historic figure (AI Mode). The UI keeps a clean, minimalist design with a strict navy-and-white color scheme.

## 🎮 How to Play

The game has two modes you can switch between at any time:

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

The game includes diverse historic figures from science, arts, politics, and culture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Lightning-fast build tool with hot module replacement
- **CSS Custom Properties** - Design tokens for consistent styling
- **Custom Fonts** - BST Spyre Book, Every Regular, Untitled Sans

## 📁 Project Structure

```
guessme/
├── src/
│   ├── components/              # React UI components
│   │   ├── Header.tsx           # Title, mode toggle, score + breakdown
│   │   ├── CharacterSilhouette.tsx
│   │   ├── CluesList.tsx
│   │   ├── ConversationView.tsx # Chat-style UI for AI Mode
│   │   ├── GuessInput.tsx
│   │   ├── FeedbackMessage.tsx
│   │   ├── GameOverModal.tsx
│   │   ├── WelcomeModal.tsx     # Intro + mode explanation
│   │   └── DocumentationModal.tsx # "How to play" overlay
│   ├── data/
│   │   └── historicFigures.ts   # Game data and clues
│   ├── hooks/
│   │   └── useGame.ts           # Central game/LLM state + logic
│   ├── reducers/
│   │   └── gameReducer.ts       # Reducer backing useGame
│   ├── services/
│   │   └── llmService.ts        # OpenAI integration + guess validation
│   ├── utils/
│   │   └── gameUtils.ts         # Scoring, shuffling, fuzzy matching
│   ├── types.ts                 # TypeScript interfaces
│   ├── App.tsx                  # App shell + layout using useGame
│   ├── App.css                  # Styles and design tokens
│   └── main.tsx                 # React entry point
├── public/                      # Static assets (fonts, test HTML)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🎨 Design Philosophy

The game uses a strict two-color palette (navy `#001f3f` and white `#ffffff`) with interactive hover states that invert colors. Typography features custom font loading with fallbacks, and the responsive layout adapts gracefully to mobile screens.

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build optimized production bundle
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint on codebase
```

## 🧩 Adding New Historic Figures

Edit `src/data/historicFigures.ts` and add to the array:

```typescript
{
  name: "Marie Curie",
  alternateNames: ["curie", "marie", "marie curie", "marie sklodowska"],
  clues: [
    "I made groundbreaking discoveries in radioactivity.",
    "I was the first woman to win a Nobel Prize.",
    "I won Nobel Prizes in two different sciences.",
    "I discovered two elements: polonium and radium.",
    "My research notebooks are still too radioactive to handle safely."
  ]
}
```

**Requirements:**
- Exactly 5 clues, ordered from vague to specific
- Include common name variations in `alternateNames` (lowercase)
- TypeScript will validate the structure automatically

## 🎯 Game Mechanics

**State Management:** React hooks (`useState`, `useCallback`, `useEffect`) manage all game state, including round progression, scoring, and figure randomization.

**Guess Validation:** Case-insensitive matching against both the canonical name and alternate name variations for flexibility.

**Scoring System:** Points decrease by 10 for each additional clue revealed. Every consecutive wrong guess deducts 5 points, but Classic rounds never drop below 50 points (AI conversations bottom out at 25).

## 🔮 AI Mode and Future Plans

An LLM-powered mode is now available and transforms the game into an interactive conversation:
- Players ask free-form questions to historic figures
- AI-generated responses in character
- Dynamic, educational gameplay
- Intelligent guess validation with fuzzy matching (plus local fuzzy matching fallback)

To enable AI Mode locally, configure your OpenAI API key in `.env.local` (see `LLM_SETUP.md` for details), then toggle Classic/AI Mode from the header.

Future improvements may include:
- Additional historic figures and conversation prompts
- Backend proxy for API calls in production
- Richer conversation memory and hint strategies
- Accessibility and animation polish for the chat UI

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
