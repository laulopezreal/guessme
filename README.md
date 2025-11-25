[![Netlify Status](https://api.netlify.com/api/v1/badges/cadeac1f-f7b5-4ed5-b2f3-d16228ca6317/deploy-status)](https://app.netlify.com/projects/guessmeyou/deploys)

# Who Am I? 🎭

A React-based guessing game where players identify historic figures through sequential clues. Features a clean, minimalist design with a strict navy-and-white color scheme.

## 🎮 How to Play

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
│   ├── components/          # React UI components
│   │   ├── Header.tsx
│   │   ├── CharacterSilhouette.tsx
│   │   ├── CluesList.tsx
│   │   ├── GuessInput.tsx
│   │   ├── FeedbackMessage.tsx
│   │   └── GameOverModal.tsx
│   ├── data/
│   │   └── historicFigures.ts   # Game data and clues
│   ├── utils/
│   │   └── gameUtils.ts         # Helper functions
│   ├── types.ts                 # TypeScript interfaces
│   ├── App.tsx                  # Main game logic
│   ├── App.css                  # Styles and design tokens
│   └── main.tsx                 # React entry point
├── public/                      # Static assets (fonts)
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

**Scoring System:** Points decrease by 10 for each additional clue revealed, with a minimum of 50 points per correct guess.

## 🔮 Future Plans

An LLM-powered mode is planned that will transform the game into an interactive conversation:
- Players ask free-form questions to historic figures
- AI-generated responses in character
- Dynamic, educational gameplay
- Intelligent guess validation with fuzzy matching

See `WARP.md` for the complete implementation plan.

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
