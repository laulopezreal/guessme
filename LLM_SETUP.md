# LLM Integration Setup

This guide walks you through setting up the LLM integration for interactive gameplay.

## ✅ Step 1: Install Dependencies (COMPLETED)

The OpenAI SDK has been installed:
```bash
npm install openai
```

## 🔑 Step 2: Configure Your API Key

1. **Get an OpenAI API Key**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key (keep it secret!)

2. **Configure `.env.local`**
   - Copy `.env.example` to `.env.local` if you haven't already:
   ```bash
   cp .env.example .env.local
   ```
   - Edit `.env.local` and update these values:
   ```
   VITE_GAME_MODE=ai
   VITE_LLM_API_KEY=sk-proj-your-actual-key-here
   VITE_LLM_MODEL=gpt-4o-mini
   ```

3. **Restart the dev server**
   - If the dev server is running, stop it (Ctrl+C) and start again
   - This loads the new environment variables

## 🧪 Step 3: Test the Integration

1. **Start the dev server**
  ```bash
  npm run dev

2. **Open the test page (optional)**
- Navigate to `http://localhost:5173/test-llm.html`
- Click the test buttons in order (1 → 2 → 3 → 4)
- Each test should show a green success message

3. **Try AI Mode in the actual game**
- Make sure `VITE_GAME_MODE=ai` is set in `.env.local`
- Restart the dev server if it's already running
- Open `http://localhost:5173/`
- The game should start in AI Mode (you'll see "Mode: AI" in the header)
- Ask a few questions and submit a guess to confirm scoring and validation work as expected

**Note**: To switch back to Classic Mode, set `VITE_GAME_MODE=classic` in `.env.local` and restart the server.

## 📁 What Was Created

### `/src/services/llmService.ts`
The core LLM service with functions:
- `isLLMConfigured()` - Check if API key is set
- `getInitialGreeting(figure)` - Get AI greeting from historic figure
- `sendMessage(history, figure, hintLevel)` - Send question and get response
- `validateGuess(guess, figure, history)` - Intelligent guess validation

### `/.env.example`
Example environment variables file with documentation

### `/.env.local`
Your local environment variables for API configuration (gitignored for security)

### `/test-llm.html`
Interactive test page to verify everything works

## 🎮 Current Integration

Now that the LLM service is working, the interactive AI Mode is fully wired into the game:

1. **Data models** - `Message`, `ConversationState`, and related types live in `types.ts`
2. **ConversationView component** - Chat interface with message bubbles and typing indicator
3. **useGame hook + App.tsx** - Central game logic and UI wiring for Classic vs AI modes
4. **Gameplay** - Static clues remain for Classic Mode; AI Mode uses the LLM for greetings, hints, and guess validation

## 💰 Cost Considerations

**gpt-4o-mini pricing (as of 2024):**
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens

**Estimated cost per game:**
- ~10-15 questions per figure
- ~200-300 tokens per interaction
- **~$0.01-0.02 per complete game**

Very affordable for development and small-scale usage!

## 🔒 Security Notes

- `.env.local` is gitignored - never commit API keys
- `dangerouslyAllowBrowser: true` is used for development
- **For production**: Build a backend proxy to hide the API key
- Set spending limits in your OpenAI account

## 🐛 Troubleshooting

**"Failed to get response from AI"**
- Check your API key is correct in `.env.local`
- Verify you have credits in your OpenAI account
- Check browser console for detailed errors

**Environment variables not loading**
- Restart the dev server after changing `.env.local`
- Make sure filename is exactly `.env.local` (not `.env.local.txt`)
- Vite only loads env vars starting with `VITE_`

**CORS errors**
- This is expected when calling OpenAI directly from browser
- OpenAI allows browser requests, so this should work
- If persistent, consider using a backend proxy

## 📚 References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- Project plan: See the "LLM-Powered Interactive Gameplay" plan document
