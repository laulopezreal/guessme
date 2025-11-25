# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React + TypeScript guessing game called "Who Am I?" where players guess historic figures based on sequential clues. The project uses modern web development tools and practices.

**Tech Stack:**
- React 19 with TypeScript
- Vite (build tool and dev server)
- CSS with custom properties
- Custom fonts: BST Spyre Book, Every Regular, Untitled Sans (Medium/Regular)

## Development Commands

### Installation

```bash
npm install
```

### Running the Project

```bash
# Development server with hot reload
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Linting

```bash
npm run lint
```

### Testing

There are no automated tests. Test manually by:
1. Running `npm run dev`
2. Opening the game in a browser
3. Verifying game mechanics (clue reveal, scoring, guess validation)

## Code Architecture

### File Structure
```
guessme/
├── public/                  # Static assets
│   └── *.woff2             # Custom font files
├── src/
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   ├── CharacterSilhouette.tsx
│   │   ├── CluesList.tsx
│   │   ├── GuessInput.tsx
│   │   ├── FeedbackMessage.tsx
│   │   └── GameOverModal.tsx
│   ├── data/
│   │   └── historicFigures.ts  # Game data
│   ├── utils/
│   │   └── gameUtils.ts        # Helper functions
│   ├── types.ts               # TypeScript interfaces
│   ├── App.tsx               # Main app component
│   ├── App.css               # Global styles
│   ├── main.tsx              # React entry point
│   └── vite-env.d.ts         # Vite type definitions
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

### Key Patterns

**Game State Management (App.tsx):**
- React hooks (`useState`, `useCallback`, `useEffect`) manage all game state
- State variables: `currentFigureIndex`, `currentClueIndex`, `score`, `round`, `gameEnded`, etc.
- `shuffledFigures` - randomized array of historic figures initialized on mount
- Game resets via `initializeGame()` callback

**TypeScript Interfaces (types.ts):**
```typescript
interface HistoricFigure {
  name: string;
  alternateNames: string[];
  clues: string[];
}

interface GameState {
  currentFigureIndex: number;
  currentClueIndex: number;
  score: number;
  round: number;
  gameEnded: boolean;
  shuffledFigures: HistoricFigure[];
}
```

**Scoring System:**
- Points awarded based on how many clues were revealed before correct guess
- Base formula: `Math.max(50, 100 - (cluesUsed - 1) * 10)`
- 1 clue = 100 points, 2 clues = 90 points, 5 clues = 50 points

**Component Architecture:**
- Functional components with TypeScript props interfaces
- Controlled components for form inputs
- Conditional rendering for UI states
- Event handlers passed as props

**Design System (App.css):**
- Strictly two-color palette: navy (#001f3f) and white (#ffffff)
- CSS custom properties for spacing, typography, and transitions
- Mobile-responsive with breakpoint at 768px
- Interactive hover states with color inversion
- Font files loaded from `/public` directory

### Game Flow

1. **Initialization** - `initializeGame()` shuffles figures and initializes state
2. **Clue Revelation** - `revealNextClue()` increments clue index, component re-renders
3. **Guess Validation** - `handleGuess()` compares input against `name` and `alternateNames`
4. **Round Progression** - `nextFigure()` advances to next character
5. **Game End** - Modal appears when all figures are guessed

## Making Changes

### Adding New Historic Figures

Edit the `historicFigures` array in `src/data/historicFigures.ts`. Each figure requires:
- `name` - canonical full name for display
- `alternateNames` - array of acceptable variations (lowercase)
- `clues` - exactly 5 clues, ordered from vague to specific

The TypeScript compiler will validate the structure matches the `HistoricFigure` interface.

### Modifying Scoring

The scoring logic is in `App.tsx` (`handleGuess` callback). The calculation uses `calculatePoints()` from `src/utils/gameUtils.ts`:
```typescript
export function calculatePoints(cluesUsed: number): number {
  return Math.max(50, 100 - (cluesUsed - 1) * 10);
}
```

### Styling Updates

All styles are in `src/App.css` using CSS custom properties defined in `:root`. Key design tokens:
- Colors: `--navy`, `--white`
- Spacing: `--spacing-xs` through `--spacing-xl`
- Typography: `--font-size-xs` through `--font-size-xxl`

When changing styles, maintain the strict navy/white color scheme and hover state inversions (background/text color swap). Changes will hot-reload in development.

### Font Changes

Fonts are loaded via `@font-face` in `src/App.css`. To add/replace fonts:
1. Add `.woff2` file to `public/` directory
2. Define `@font-face` rule at the top of `src/App.css` (outside `:root`)
3. Reference font with `/filename.woff2` (Vite serves from `public/`)
4. Update `--font-family` custom property in `:root` or apply directly to elements

## Important Notes

- **Build process**: Uses Vite for fast HMR (Hot Module Replacement) in dev mode
- **Type safety**: TypeScript provides compile-time type checking and autocomplete
- **Type-only imports**: Use `import type` for TypeScript interfaces (required by `verbatimModuleSyntax`)
- **Case-insensitive matching**: All guess validation converts to lowercase
- **Answer flexibility**: Always add common variations to `alternateNames` (e.g., "Einstein" for "Albert Einstein")
- **Clue progression**: First clue auto-reveals when figure loads; remaining 4 require button clicks
- **Accessibility**: Input supports Enter key for submission; buttons show disabled states
- **React patterns**: Use functional components, hooks, and controlled inputs

## Migration Notes

The original vanilla JavaScript version has been preserved as:
- `index-vanilla.html` - Original HTML
- `script-vanilla.js` - Original JavaScript

These files are kept for reference but are not used by the React build.

## Next Steps

### Planned Feature: LLM-Powered Interactive Gameplay

A comprehensive plan has been created to integrate an LLM into the game for dynamic, conversational interactions. This will transform the static clue-based gameplay into an interactive conversation with historic figures.

**Key Features:**
- Players ask free-form questions instead of clicking "Reveal Next Clue"
- Historic figures respond in character with AI-generated hints
- Intelligent guess validation (handles variations, typos, partial answers)
- Context-aware conversations that feel natural and educational
- Scoring based on number of questions asked instead of clues revealed

**Implementation Approach:**
- Start with client-side LLM API integration (OpenAI/Anthropic)
- Add conversation UI with chat bubbles and typing indicators
- Create system prompts for each historic figure's personality
- Implement hybrid mode (toggle between classic and LLM modes)
- Plan migration to backend proxy for production security

**Implementation Order:**
1. Set up LLM service layer and API configuration
2. Update data models (add systemPrompt, bio to historic figures)
3. Create ConversationView component (chat interface)
4. Update App.tsx with conversation state management
5. Implement question/answer flow
6. Add LLM-powered guess validation
7. Update scoring system
8. Add UI polish and error handling
9. Implement feature flag for classic vs LLM mode
10. Testing and documentation updates

For the complete detailed plan, see the LLM Integration Plan document created in this session.
