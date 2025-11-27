import { useCallback, useEffect, useReducer } from 'react';
import { getEnabledFigures } from '../data/figuresConfig';
import { calculatePoints, shuffleArray, selectNextClue, llmScoreWeights, isCloseMatch } from '../utils/gameUtils';
import { isLLMConfigured, getInitialGreeting, sendMessage, validateGuess } from '../services/llmService';
import type { Message, HistoricFigure, Clue } from '../types';
import { gameReducer, initialState } from '../reducers/gameReducer';

const MISS_THRESHOLD = 2;
const QUESTION_LIMIT = 15;

export function useGame() {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    const {
        shuffledFigures,
        currentFigureIndex,
        revealedClues,
        consecutiveMisses,
        score,
        round,
        gameEnded,
        feedbackMessage,
        feedbackType,
        lastRoundBreakdown,
        lastRoundNumber,
        personaLine,
        isRevealed,
        inputDisabled,
        showNextButton,
        triggerShake,
        adaptiveHintNotice,
        llmMode,
        messages,
        questionsAsked,
        isTyping,
        showWelcome,
        showDocs,
        outOfQuestions,
    } = state;

    const currentFigure = shuffledFigures[currentFigureIndex];

    // Initialize conversation with AI greeting
    const initializeConversation = useCallback(async (figure: HistoricFigure) => {
        if (!llmMode) return;

        dispatch({ type: 'SET_IS_TYPING', payload: true });
        try {
            const rawGreeting = await getInitialGreeting(figure);

            // We expect the model to return exactly 3 lines:
            // 1) greeting sentence
            // 2) poem line 1
            // 3) poem line 2
            const lines = rawGreeting
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

            const greetingLine = lines[0] ?? rawGreeting;
            const poemText = lines.slice(1).join('\n');
            const baseTimestamp = Date.now();

            const greetingMessage: Message = {
                id: `msg-${baseTimestamp}`,
                role: 'assistant',
                content: greetingLine,
                timestamp: baseTimestamp,
            };

            // Seed conversation with the greeting line
            dispatch({ type: 'RESET_CONVERSATION', payload: { initialMessage: greetingMessage } });

            // If we have poem content, add it as a second assistant message
            if (poemText) {
                const poemMessage: Message = {
                    id: `msg-${baseTimestamp}-poem`,
                    role: 'assistant',
                    content: poemText,
                    timestamp: baseTimestamp + 1,
                };
                dispatch({ type: 'ADD_MESSAGE', payload: poemMessage });
            }
        } catch (error) {
            console.error('Failed to get initial greeting:', error);
            dispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'AI mode failed. Switching to classic mode.', type: 'error' }
            });
            dispatch({ type: 'SET_LLM_MODE', payload: false });
        } finally {
            dispatch({ type: 'SET_IS_TYPING', payload: false });
        }
    }, [llmMode]);

    // Initialize game
    const initializeGame = useCallback(() => {
        const enabledFigures = getEnabledFigures();
        const shuffled = shuffleArray(enabledFigures);
        dispatch({ type: 'INIT_GAME', payload: { figures: shuffled } });
    }, []);

    // Initialize on mount
    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    // Initialize conversation when figure changes in LLM mode
    useEffect(() => {
        if (llmMode && currentFigure && messages.length === 0) {
            initializeConversation(currentFigure);
        }
    }, [llmMode, currentFigure, messages.length, initializeConversation]);

    // Reveal the first clue when a new figure loads
    useEffect(() => {
        if (!currentFigure) return;

        // Only if we haven't revealed any clues yet (which is true after NEXT_FIGURE or INIT_GAME)
        if (revealedClues.length === 0) {
            const initialClue = currentFigure.clues && currentFigure.clues.length > 0 ? currentFigure.clues[0] : undefined;
            if (initialClue) {
                dispatch({
                    type: 'REVEAL_CLUE',
                    payload: { clue: initialClue }
                });
            }
        }
    }, [currentFigure, revealedClues.length]);

    const revealNextClue = useCallback((misses = consecutiveMisses) => {
        if (!currentFigure) return;

        const { nextClue, adaptive } = selectNextClue(currentFigure, revealedClues, misses, MISS_THRESHOLD);

        if (!nextClue || revealedClues.some((clue: Clue) => clue.text === nextClue.text)) return;

        dispatch({
            type: 'REVEAL_CLUE',
            payload: { clue: nextClue, isAdaptive: adaptive, adaptiveNotice: adaptive ? 'An adaptive hint was provided after repeated misses. Future points will factor this in.' : undefined }
        });
    }, [consecutiveMisses, currentFigure, revealedClues]);

    // Handle asking a question (LLM mode)
    const handleAskQuestion = useCallback(async (question: string) => {
        if (!currentFigure || !llmMode) return;

        if (questionsAsked >= QUESTION_LIMIT) {
            dispatch({
                type: 'SET_FEEDBACK',
                payload: { message: "You're out of questions for this round. Start a new conversation or submit your best guess!", type: 'error' }
            });
            dispatch({ type: 'SET_OUT_OF_QUESTIONS', payload: true });
            return;
        }

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: question,
            timestamp: Date.now(),
        };

        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

        // We need to calculate nextQuestionCount here to check limit
        const nextQuestionCount = questionsAsked + 1;
        if (nextQuestionCount >= QUESTION_LIMIT) {
            dispatch({ type: 'SET_OUT_OF_QUESTIONS', payload: true });
        }

        dispatch({ type: 'SET_IS_TYPING', payload: true });

        // Update hint level based on questions asked
        const newHintLevel = Math.min(5, Math.floor(nextQuestionCount / 2) + 1);

        try {
            // We need the updated messages list for the API call. 
            // State update is async, so we construct it manually.
            const conversationHistory = [...messages, userMessage].filter(m => m.role !== 'system');
            const response = await sendMessage(conversationHistory, currentFigure, newHintLevel);

            const assistantMessage: Message = {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
            };

            dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        } catch (error) {
            console.error('Failed to get AI response:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            
            // Add error as system message in conversation
            const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: 'system',
                content: `⚠️ AI Error: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`,
                timestamp: Date.now(),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
            
            dispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'Failed to get AI response. Try again.', type: 'error' }
            });
        } finally {
            dispatch({ type: 'SET_IS_TYPING', payload: false });
        }
    }, [currentFigure, llmMode, messages, questionsAsked]);

    // Check guess
    const handleGuess = useCallback(async (guess: string) => {
        if (!currentFigure) return;

        // Helper function for handling incorrect guesses
        const handleIncorrectGuess = (feedbackMsg: string) => {
            dispatch({
                type: 'REGISTER_MISS',
                payload: { feedback: feedbackMsg, triggerShake: true }
            });

            // We need to check if we should reveal a clue based on the NEW miss count.
            // `consecutiveMisses` in state is the OLD value.
            // The reducer updates it.
            // But here we are in the callback closure, so `consecutiveMisses` is the old value.
            const newMisses = consecutiveMisses + 1;
            if (newMisses >= MISS_THRESHOLD) {
                // We need to call revealNextClue with the new miss count
                revealNextClue(newMisses);
            }

            setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 500);
        };

        // LLM mode: use AI validation
        if (llmMode) {
            // Add the original user message to conversation
            const now = Date.now();
            const userMessage: Message = {
                id: `user-${now}`,
                role: 'user',
                content: guess,
                timestamp: now,
            };
            dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

            // Add system message indicating this is being treated as a guess
            const systemNotice: Message = {
                id: `system-${now + 1}`,
                role: 'system',
                content: `Treating "${guess}" as a guess...`,
                timestamp: now + 1,
            };
            dispatch({ type: 'ADD_MESSAGE', payload: systemNotice });

            dispatch({ type: 'SET_IS_TYPING', payload: true });
            try {
                const result = await validateGuess(guess, currentFigure, messages);
                console.log('Guess validation result:', { guess, result });

                if (result.isCorrect) {
                    // Correct guess
                    const breakdown = calculatePoints(
                        {
                            cluesUsed: 1,
                            adaptiveHintsUsed: questionsAsked,
                            consecutiveMisses,
                        },
                        llmScoreWeights
                    );

                    // Figure confirms correct answer
                    const now = Date.now();
                    const figureResponse: Message = {
                        id: `response-${now}`,
                        role: 'assistant',
                        content: `You are correct! I am indeed ${currentFigure.name}. Well done!`,
                        timestamp: now,
                    };
                    dispatch({ type: 'ADD_MESSAGE', payload: figureResponse });

                    // Add score notification
                    const scoreMessage: Message = {
                        id: `score-${now + 1}`,
                        role: 'system',
                        content: `You earned ${breakdown.total} points!`,
                        timestamp: now + 1,
                    };
                    dispatch({ type: 'ADD_MESSAGE', payload: scoreMessage });

                    dispatch({
                        type: 'CORRECT_GUESS',
                        payload: {
                            scoreDelta: breakdown.total,
                            feedback: `${result.feedback} You earned ${breakdown.total} points!`,
                            voiceLine: currentFigure.voiceLine,
                            breakdown,
                        }
                    });
                } else if (result.confidence >= 0.7) {
                    // Close typo/misspelling - give helpful feedback without penalty
                    const typoMessage: Message = {
                        id: `typo-${Date.now()}`,
                        role: 'assistant',
                        content: `${result.feedback}`,
                        timestamp: Date.now(),
                    };
                    dispatch({ type: 'ADD_MESSAGE', payload: typoMessage });

                    dispatch({
                        type: 'SET_FEEDBACK',
                        payload: { message: result.feedback, type: 'success' }
                    });
                } else {
                    // Incorrect guess - figure responds
                    const figureResponse: Message = {
                        id: `response-${Date.now()}`,
                        role: 'assistant',
                        content: `Incorrect. That is not who I am. Keep asking questions to learn more about me.`,
                        timestamp: Date.now(),
                    };
                    dispatch({ type: 'ADD_MESSAGE', payload: figureResponse });

                    handleIncorrectGuess(result.feedback);
                }
            } catch (error) {
                console.error('Validation error:', error);
                dispatch({
                    type: 'SET_FEEDBACK',
                    payload: { message: 'Validation failed. Try again.', type: 'error' }
                });
            } finally {
                dispatch({ type: 'SET_IS_TYPING', payload: false });
            }
            return;
        }

        // Classic mode: fuzzy string matching
        const correctAnswers = [
            currentFigure.name,
            ...currentFigure.alternateNames
        ];

        const isCorrect = correctAnswers.some(answer => isCloseMatch(guess, answer));

        if (isCorrect) {
            // Correct guess
            const breakdown = calculatePoints({
                cluesUsed: revealedClues.length,
                adaptiveHintsUsed: 0,
                consecutiveMisses,
            });

            dispatch({
                type: 'CORRECT_GUESS',
                payload: {
                    scoreDelta: breakdown.total,
                    feedback: `Correct! It's ${currentFigure.name}! You earned ${breakdown.total} points!`,
                    voiceLine: currentFigure.voiceLine,
                    breakdown,
                }
            });
        } else {
            handleIncorrectGuess('Not quite! Try again or reveal more clues.');
        }
    }, [
        consecutiveMisses,
        currentFigure,
        llmMode,
        messages,
        questionsAsked,
        revealedClues,
        revealNextClue,
    ]);

    // Next figure
    const nextFigure = useCallback(() => {
        dispatch({ type: 'NEXT_FIGURE' });
    }, []);

    // Toggle between classic and LLM mode
    const handleModeToggle = useCallback(() => {
        if (isLLMConfigured()) {
            dispatch({ type: 'SET_LLM_MODE', payload: !llmMode });
        } else {
            dispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'Please configure your API key in .env.local (see LLM_SETUP.md) to use AI mode.', type: 'error' }
            });
        }
    }, [llmMode]);

    // Restart game
    const restartGame = useCallback(() => {
        const enabledFigures = getEnabledFigures();
        const shuffled = shuffleArray(enabledFigures);
        dispatch({ type: 'RESTART_GAME', payload: { figures: shuffled } });
    }, []);

    // Start game (from welcome modal)
    const handleStartGame = useCallback(() => {
        dispatch({ type: 'START_GAME' });
    }, []);

    // Show/hide documentation
    const handleShowDocs = useCallback(() => {
        dispatch({ type: 'TOGGLE_DOCS', payload: true });
    }, []);

    const handleCloseDocs = useCallback(() => {
        dispatch({ type: 'TOGGLE_DOCS', payload: false });
    }, []);

    const resetConversation = useCallback(() => {
        if (!currentFigure || !llmMode) return;
        dispatch({ type: 'RESET_CONVERSATION', payload: {} });
        initializeConversation(currentFigure);
    }, [currentFigure, initializeConversation, llmMode]);

    const handleValidationError = useCallback((message: string) => {
        dispatch({
            type: 'SET_FEEDBACK',
            payload: { message, type: 'error' }
        });
    }, []);

    const handleGiveUp = useCallback(() => {
        dispatch({ type: 'GIVE_UP' });
    }, []);

    return {
        // State
        shuffledFigures,
        currentFigureIndex,
        revealedClues,
        consecutiveMisses,
        score,
        round,
        gameEnded,
        feedbackMessage,
        feedbackType,
        personaLine,
        isRevealed,
        inputDisabled,
        showNextButton,
        triggerShake,
        adaptiveHintNotice,
        llmMode,
        messages,
        questionsAsked,
        isTyping,
        showWelcome,
        showDocs,
        outOfQuestions,
        currentFigure,
        lastRoundBreakdown,
        lastRoundNumber,

        // Actions
        revealNextClue,
        handleAskQuestion,
        handleGuess,
        nextFigure,
        handleModeToggle,
        restartGame,
        handleStartGame,
        handleShowDocs,
        handleCloseDocs,
        resetConversation,
        handleValidationError,
        handleGiveUp,

        // Constants
        QUESTION_LIMIT,
    };
}
