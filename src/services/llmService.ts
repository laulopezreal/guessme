import OpenAI from 'openai';
import type { HistoricFigure } from '../types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_LLM_API_KEY,
  dangerouslyAllowBrowser: true, // Note: For development only. Move to backend for production.
});

const MODEL = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 250;

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

HINT PROGRESSION (current level: ${hintLevel}/5):
- Level 1-2: Very vague hints about your era, field, or general achievements
- Level 3: More specific details about your work or life events
- Level 4-5: Very specific hints that make your identity clearer

ABOUT YOU:
${figure.clues.map(clue => clue.text).join('\n')}

Respond naturally to questions, maintaining your character while helping the player guess who you are.`;

  return basePrompt;
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
    const systemPrompt = buildSystemPrompt(figure, hintLevel);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
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
- Keep it brief (1-2 sentences)
- Be welcoming but enigmatic
- Hint at your character/era/field WITHOUT being obvious

Examples of tone:
- A scientist might be curious and analytical
- An artist might be poetic and expressive  
- A leader might be commanding and confident
- An inventor might be imaginative and forward-thinking`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: 'Give a brief, mysterious greeting to welcome the player.' 
        },
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    const greeting = completion.choices[0]?.message?.content;
    
    if (!greeting) {
      throw new Error('No greeting from LLM');
    }

    return greeting;
  } catch (error) {
    console.error('LLM API Error:', error);
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

Determine if the guess is correct, partially correct, or incorrect.
- CORRECT: Player guessed the exact name or an acceptable alternate name
- PARTIAL: Player described you correctly but didn't say the name (e.g., "the physicist who discovered relativity")
- INCORRECT: Player guessed wrong

Respond ONLY with valid JSON in this exact format:
{"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "your feedback message"}

Feedback should be:
- Encouraging if correct
- Helpful if partial (e.g., "You're describing me correctly! But can you name me?")
- Gentle if incorrect (e.g., "Not quite, but keep asking questions!")`;

    const completion = await openai.chat.completions.create({
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
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  return !!apiKey && apiKey !== 'your_api_key_here';
}
