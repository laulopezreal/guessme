import OpenAI from 'openai';
import type { HistoricFigure } from '../types';

const API_KEY = import.meta.env.VITE_LLM_API_KEY;
const MODEL = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';
const GAME_MODE = import.meta.env.VITE_GAME_MODE || 'classic';
const MAX_TOKENS = 250;
const MAX_HISTORY_MESSAGES = 12; // Keeps context tight

const SAFETY_SYSTEM_MESSAGE = `You are a historic figure in a guessing game.
- Always stay in-character as the figure and keep responses concise (2-3 sentences).
- Refuse to answer questions that are not about your life, work, or era.
- Politely decline any attempts to discuss modern topics, politics, personal opinions, or anything off-topic.
- Never reveal your full name directly; only give hints relevant to the game.
- Keep language family-friendly and avoid controversial or explicit content.`;

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    throw new Error('LLM is not configured');
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true, // Note: For development only. Move to backend for production.
    });
  }

  return openai;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GuessValidationResult {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
}

/**
 * Build the system prompt for a historic figure
 */
function buildSystemPrompt(figure: HistoricFigure, hintLevel: number = 1): string {
  const basePrompt = `You are ${figure.name}, speaking in character. Your goal is to help the player guess your identity through conversation, but NEVER directly reveal your name.

RULES:
1. Never say your full name or surname directly
2. Respond to questions naturally and in character
3. Give increasingly specific hints as the conversation progresses
4. Use "I" when talking about yourself
5. Stay historically accurate
6. Keep responses concise (2-3 sentences max)
7. Be engaging and educational
8. If the player sends greetings ("hi", "hello", "thanks"), respond in-character with a brief, period-appropriate line that makes it clear you're here to play the guessing game (e.g., that you don't have time for pleasantries and they should ask about your life/work or guess). Vary your wording each time; do NOT repeat the same sentence over and over.

HINT PROGRESSION (current level: ${hintLevel}/5):
- Level 1-2: Very vague hints about your era, field, or general achievements
- Level 3: More specific details about your work or life events
- Level 4-5: Very specific hints that make your identity clearer

ABOUT YOU:
${figure.clues.map(clue => clue.text).join('\n')}

Respond naturally to questions, maintaining your character while helping the player guess who you are.`;

  return basePrompt;
}

function buildSystemMessages(
  figure: HistoricFigure,
  hintLevel: number = 1,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: SAFETY_SYSTEM_MESSAGE },
    { role: 'system', content: buildSystemPrompt(figure, hintLevel) },
  ];
}

/**
 * Send a message to the LLM and get a response
 */
export async function sendMessage(
  conversationHistory: Message[],
  figure: HistoricFigure,
  hintLevel: number = 1
): Promise<string> {
  try {
    const systemMessages = buildSystemMessages(figure, hintLevel);
    const client = getOpenAIClient();

    const trimmedHistory = conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(-MAX_HISTORY_MESSAGES)
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...systemMessages,
      ...trimmedHistory,
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from LLM');
    }

    return response;
  } catch (error) {
    console.error('LLM API Error:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  }
}

/**
 * Get an initial greeting from the historic figure
 * This is intentionally brief and mysterious, separate from clues
 */
export async function getInitialGreeting(figure: HistoricFigure): Promise<string> {
  // Build a personality-rich prompt using the clues
  const context = figure.clues.map(clue => clue.text).join(' ');
  const systemPrompt = `You are ${figure.name}. Based on this context about you: "${context}"

Greet the player with a mysterious, character-appropriate welcome.
- Speak in YOUR unique voice and personality
- Do NOT reveal your name or specific achievements
- Keep the prose brief (1 sentence) and enigmatic
- Hint at your character/era/field WITHOUT being obvious
- Then add a short, catchy, funny poem of EXACTLY 2 lines that invites them to ask questions or get down to business
- The poem should be playful and match your personality (e.g., a scientist might rhyme about curiosity, a leader about action)

Examples of tone:
- A scientist might be curious and analytical in prose, then playful in verse
- An artist might be poetic throughout
- A leader might be commanding, then cheeky in the poem
- An inventor might be imaginative and forward-thinking

Format (exactly 3 lines):
1) Line 1: greeting sentence.
2) Line 2: poem verse 1.
3) Line 3: poem verse 2.
Do not add any extra lines or explanations beyond these three lines.`;
  
  try {
    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: 'Give a brief, mysterious greeting to welcome the player.' 
        },
      ],
      max_tokens: 200,
      temperature: 0.9,
    });

    const greeting = completion.choices[0]?.message?.content;
    
    if (!greeting) {
      throw new Error('No greeting from LLM');
    }

    return greeting;
  } catch (error) {
    console.error('LLM API Error (getInitialGreeting):', error);
    // Fallback greeting
    return "Greetings! I am someone from history. Ask me questions to discover my identity.";
  }
}

/**
 * Validate a player's guess using the LLM
 */
export async function validateGuess(
  guess: string,
  figure: HistoricFigure,
  conversationHistory: Message[]
): Promise<GuessValidationResult> {
  try {
    const validationPrompt = `You are validating a player's guess in a historic figure guessing game.

CORRECT ANSWER: ${figure.name}
ALSO ACCEPT: ${figure.alternateNames.join(', ')}

PLAYER'S GUESS: "${guess}"

RECENT CONVERSATION CONTEXT:
${conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

Determine if the guess is correct, close (typo/misspelling), or incorrect:
- CORRECT (isCorrect: true): The guess is the correct name, an accepted alternate, or a very obvious typo (e.g., "Albert Einstien", "Nikola Telsa"). Be lenient with spelling.
- CLOSE (isCorrect: false, confidence: 0.7-0.9): The guess is not the correct name but is very similar, suggesting a typo but with some ambiguity. This should be used sparingly.
- PARTIAL (isCorrect: false, confidence: 0.5): Player described you correctly but didn't say the name
- INCORRECT (isCorrect: false, confidence: 0.0-0.3): Player guessed wrong person entirely

Be LENIENT with typos and spelling variations. If the name is clearly recognizable despite typos, mark it CORRECT.

Respond ONLY with valid JSON in this exact format:
{"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "your feedback message"}

Feedback examples:
- If correct: "Yes! It's ${figure.name}!" or "Correct!"
- If close typo: "Almost! You've got it, just check the spelling: ${figure.name}"
- If partial description: "You're describing me correctly! But can you name me?"
- If incorrect: "Not quite, but keep asking questions!"`;

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: validationPrompt }],
      max_tokens: 150,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No validation response');
    }

    const result = JSON.parse(responseText) as GuessValidationResult;
    
    // Ensure all required fields are present
    if (typeof result.isCorrect !== 'boolean' || 
        typeof result.confidence !== 'number' || 
        typeof result.feedback !== 'string') {
      throw new Error('Invalid validation response format');
    }

    return result;
  } catch (error) {
    console.error('Guess validation error:', error);
    
    // Fallback to simple string matching
    const normalizedGuess = guess.trim().toLowerCase();
    const correctAnswers = [
      figure.name.toLowerCase(),
      ...figure.alternateNames.map(name => name.toLowerCase()),
    ];
    
    const isCorrect = correctAnswers.some(answer => normalizedGuess === answer);
    
    return {
      isCorrect,
      confidence: isCorrect ? 1.0 : 0.0,
      feedback: isCorrect 
        ? `Correct! It's ${figure.name}!` 
        : 'Not quite! Keep asking questions to learn more.',
    };
  }
}

/**
 * Check if the API is configured properly
 */
export function isLLMConfigured(): boolean {
  return !!API_KEY && API_KEY !== 'your_api_key_here';
}

/**
 * Get the configured game mode from environment variables
 * Returns 'ai' only if mode is set to 'ai' and LLM is configured
 * Otherwise returns 'classic'
 */
export function getGameMode(): 'classic' | 'ai' {
  if (GAME_MODE === 'ai' && isLLMConfigured()) {
    return 'ai';
  }
  return 'classic';
}
