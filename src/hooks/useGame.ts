import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { allFigures, getEnabledFigures, toFigure } from '../data/figuresConfig';
import { calculatePoints, shuffleArray, selectNextClue, llmScoreWeights, isCorrectGuess, getFigureNameTokens, getDailyPuzzle, utcDateKey, DAILY_ASK_LIMIT } from '../utils/gameUtils';
import { AiRequestError, converseWithFigure, describeAiError, fetchAiStatus, getInitialGreeting, sendMessage, validateGuess } from '../services/llmService';
import { rememberGameMode, type GameMode } from '../services/gameMode';
import { getDailyResult, loadDailyStats, recordDailyResult, saveDailyStats, setDailyQuestionsAsked } from '../services/dailyStats';
import { clearDailyProgress, loadDailyProgress, saveDailyProgress } from '../services/dailyProgress';
import { track } from '../services/analytics';
import type { Message, HistoricFigure, Clue, DailyRecord, ShareMethod } from '../types';
import { gameReducer, initialState } from '../reducers/gameReducer';

const MISS_THRESHOLD = 2;
const QUESTION_LIMIT = 15;
const ADAPTIVE_HINT_NOTICE = 'An adaptive hint was provided after repeated misses. Future points will factor this in.';

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
        llmMode: preferredLlmMode,
        aiStatus,
        messages,
        questionsAsked,
        isTyping,
        showWelcome,
        showDocs,
        outOfQuestions,
        playKind,
        daily,
        roundOutcome,
        dailyAsk,
    } = state;

    const currentFigure = shuffledFigures[currentFigureIndex];
    const isDaily = playKind === 'daily';
    // The daily puzzle always runs under Classic rules; the AI preference waits for practice.
    const llmMode = preferredLlmMode && !isDaily;
    const mode: GameMode = llmMode ? 'ai' : 'classic';
    const aiAvailable = aiStatus !== 'unavailable';

    // Daily puzzle stats live in localStorage. Today's key moves on when a new puzzle is opened.
    const [dailyStats, setDailyStats] = useState(loadDailyStats);
    const [todayKey, setTodayKey] = useState(() => utcDateKey(new Date()));
    const todayResult = getDailyResult(dailyStats, todayKey);
    // Whether an unfinished round was waiting when the app loaded; the welcome modal offers to resume it.
    const [dailyInProgress] = useState(() => loadDailyProgress(todayKey) !== null);

    // Name fragments used by the input to spot guesses typed as questions.
    const guessTokens = useMemo(() => getFigureNameTokens(shuffledFigures), [shuffledFigures]);

    // Ask the server whether AI mode can be served (only it holds the API key).
    useEffect(() => {
        let cancelled = false;
        fetchAiStatus().then(status => {
            if (cancelled) return;
            dispatch({ type: 'SET_AI_STATUS', payload: { available: status.available } });
            if (!status.available) track('ai_unavailable');
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Turn an AI failure into a player-facing message. Returns null when the
    // reducer already explains the situation (AI mode switched off).
    const reportAiFailure = useCallback((error: unknown, op: string): string | null => {
        const code = error instanceof AiRequestError ? error.code : 'network_error';
        track('ai_error', { op, code });
        if (code === 'ai_unavailable') {
            dispatch({ type: 'SET_AI_STATUS', payload: { available: false } });
            return null;
        }
        return describeAiError(error);
    }, []);

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
            const message = reportAiFailure(error, 'greeting');
            if (message) {
                dispatch({ type: 'SET_FEEDBACK', payload: { message, type: 'error' } });
            }
        } finally {
            dispatch({ type: 'SET_IS_TYPING', payload: false });
        }
    }, [llmMode, reportAiFailure]);

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

    // Keep an unfinished daily round in storage so a reload or a detour into practice resumes it.
    useEffect(() => {
        if (!isDaily || !daily || roundOutcome || revealedClues.length === 0) return;
        saveDailyProgress({
            version: 1,
            dateKey: daily.dateKey,
            revealed: revealedClues.map(clue => ({ text: clue.text, adaptive: Boolean(clue.isAdaptive) })),
            misses: consecutiveMisses,
        });
    }, [consecutiveMisses, daily, isDaily, revealedClues, roundOutcome]);

    const revealNextClue = useCallback((misses = consecutiveMisses) => {
        if (!currentFigure) return;

        const { nextClue, adaptive } = selectNextClue(currentFigure, revealedClues, misses, MISS_THRESHOLD);

        if (!nextClue || revealedClues.some((clue: Clue) => clue.text === nextClue.text)) return;

        dispatch({
            type: 'REVEAL_CLUE',
            payload: { clue: nextClue, isAdaptive: adaptive, adaptiveNotice: adaptive ? ADAPTIVE_HINT_NOTICE : undefined }
        });
        track('clue_revealed', { mode, index: revealedClues.length + 1, adaptive });
    }, [consecutiveMisses, currentFigure, mode, revealedClues]);

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
        track('ai_question_asked', { number: nextQuestionCount, round });

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
            const message = reportAiFailure(error, 'message');
            if (message) {
                // Add error as system message in conversation
                const errorMsg: Message = {
                    id: `error-${Date.now()}`,
                    role: 'system',
                    content: `⚠️ ${message}`,
                    timestamp: Date.now(),
                };
                dispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
                dispatch({ type: 'SET_FEEDBACK', payload: { message, type: 'error' } });
            }
        } finally {
            dispatch({ type: 'SET_IS_TYPING', payload: false });
        }
    }, [currentFigure, llmMode, messages, questionsAsked, reportAiFailure, round]);

    // Store today's result once and report it. A finished puzzle is restored
    // rather than replayed, and a second call for the same day is a no-op anyway.
    const recordDaily = useCallback((won: boolean, cluesUsed: number, roundScore: number, misses: number) => {
        if (!daily || !currentFigure) return;
        const record: DailyRecord = {
            dateKey: daily.dateKey,
            dayNumber: daily.dayNumber,
            won,
            cluesUsed,
            totalClues: currentFigure.clues.length,
            score: roundScore,
            misses,
        };
        const next = recordDailyResult(dailyStats, record);
        if (next === dailyStats) return;
        setDailyStats(next);
        saveDailyStats(next);
        clearDailyProgress();
        track('daily_completed', { won, clues_used: cluesUsed, score: roundScore });
    }, [currentFigure, daily, dailyStats]);

    // Check guess
    const handleGuess = useCallback(async (guess: string) => {
        if (!currentFigure) return;

        // Helper function for handling incorrect guesses
        const handleIncorrectGuess = (feedbackMsg: string) => {
            dispatch({
                type: 'REGISTER_MISS',
                payload: { feedback: feedbackMsg, triggerShake: true }
            });
            track('guess_incorrect', { mode, round });

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
                    track('round_completed', {
                        mode,
                        round,
                        points: breakdown.total,
                        questions: questionsAsked,
                        misses: consecutiveMisses,
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
                const message = reportAiFailure(error, 'validate');
                if (message) {
                    dispatch({ type: 'SET_FEEDBACK', payload: { message, type: 'error' } });
                }
            } finally {
                dispatch({ type: 'SET_IS_TYPING', payload: false });
            }
            return;
        }

        // Classic mode: the name or an alternate name, with typos forgiven. The whole
        // roster, not shuffledFigures (only today's figure in Daily), so another
        // figure's name never counts as a typo.
        const isCorrect = isCorrectGuess(guess, currentFigure, allFigures);

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
            track('round_completed', {
                mode,
                kind: playKind,
                round,
                points: breakdown.total,
                clues_used: revealedClues.length,
                misses: consecutiveMisses,
            });
            if (isDaily) {
                recordDaily(true, revealedClues.length, breakdown.total, consecutiveMisses);
            }
        } else {
            handleIncorrectGuess('Not quite! Try again or reveal more clues.');
        }
    }, [
        consecutiveMisses,
        currentFigure,
        isDaily,
        llmMode,
        messages,
        mode,
        playKind,
        questionsAsked,
        recordDaily,
        reportAiFailure,
        revealedClues,
        revealNextClue,
        round,
    ]);

    // Next figure
    const nextFigure = useCallback(() => {
        if (currentFigureIndex + 1 >= shuffledFigures.length) {
            track('game_completed', { mode, score, rounds: shuffledFigures.length });
        }
        dispatch({ type: 'NEXT_FIGURE' });
    }, [currentFigureIndex, mode, score, shuffledFigures.length]);

    // Restart game
    const restartGame = useCallback(() => {
        const enabledFigures = getEnabledFigures();
        const shuffled = shuffleArray(enabledFigures);
        dispatch({ type: 'RESTART_GAME', payload: { figures: shuffled } });
        track('game_restarted', { mode });
    }, [mode]);

    // Start game (from welcome modal)
    const handleStartGame = useCallback(() => {
        dispatch({ type: 'START_GAME' });
        track('game_started', { mode, figures: shuffledFigures.length });
    }, [mode, shuffledFigures.length]);

    // Switch between Classic and AI mode. Mid-game switches restart the game
    // because the two modes score rounds differently.
    const setMode = useCallback((nextMode: GameMode) => {
        if (isDaily) return; // the daily puzzle is always Classic; go back to practice to switch
        if (nextMode === mode) return;
        if (nextMode === 'ai' && !aiAvailable) return;

        rememberGameMode(nextMode);
        const midGame = !showWelcome && !gameEnded;
        if (midGame) {
            dispatch({ type: 'RESTART_GAME', payload: { figures: shuffleArray(getEnabledFigures()), mode: nextMode } });
        } else {
            dispatch({ type: 'SET_MODE', payload: { mode: nextMode } });
        }
        track('mode_changed', { mode: nextMode, mid_game: midGame });
    }, [aiAvailable, gameEnded, isDaily, mode, showWelcome]);

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
        track('gave_up', { mode, kind: playKind, round });
        if (isDaily) {
            recordDaily(false, revealedClues.length, 0, consecutiveMisses);
        }
    }, [consecutiveMisses, isDaily, mode, playKind, recordDaily, revealedClues.length, round]);

    // Today's puzzle: the same figure for everyone, one attempt. A finished
    // puzzle comes back as it ended, with its result instead of a replay.
    const startDaily = useCallback(() => {
        // The full roster: disabled figures keep their slots so nobody else's day moves.
        const puzzle = getDailyPuzzle(allFigures, new Date());
        if (!puzzle) return;
        setTodayKey(puzzle.dateKey);
        const prior = getDailyResult(dailyStats, puzzle.dateKey);

        // An unfinished round from earlier today resumes. Clue texts are matched against the
        // figure, so an edited roster cannot resurrect clues that no longer exist.
        const saved = prior ? null : loadDailyProgress(puzzle.dateKey);
        const revealedClues = (saved?.revealed ?? []).flatMap(entry => {
            const clue = puzzle.figure.clues.find(candidate => candidate.text === entry.text);
            return clue ? [{ ...clue, isAdaptive: entry.adaptive }] : [];
        });

        dispatch({
            type: 'START_DAILY',
            payload: {
                figure: toFigure(puzzle.figure),
                dateKey: puzzle.dateKey,
                dayNumber: puzzle.dayNumber,
                priorResult: prior
                    ? { won: prior.won, cluesUsed: prior.cluesUsed, score: prior.score, questionsAsked: prior.questionsAsked }
                    : undefined,
                progress: saved
                    ? {
                        revealedClues,
                        consecutiveMisses: saved.misses,
                        adaptiveNotice: revealedClues.some(clue => clue.isAdaptive) ? ADAPTIVE_HINT_NOTICE : undefined,
                    }
                    : undefined,
            },
        });
        if (!prior) track('daily_started', { day: puzzle.dayNumber, resumed: revealedClues.length > 0 });
    }, [dailyStats]);

    // Back to the endless practice game, in the mode the player had chosen.
    const startPractice = useCallback(() => {
        dispatch({ type: 'RESTART_GAME', payload: { figures: shuffleArray(getEnabledFigures()) } });
        track('practice_started', { from: playKind });
    }, [playKind]);

    // The open chat with today's figure once the round is over. The free allowance is
    // counted only when an answer arrives and kept with the day's record, so a failed
    // request costs nothing and a reload does not reset it.
    const askDailyFigure = useCallback(async (question: string) => {
        if (!isDaily || !daily || !currentFigure || !roundOutcome || !aiAvailable) return;
        if (dailyAsk.isTyping || dailyAsk.used >= DAILY_ASK_LIMIT) return;

        const now = Date.now();
        const userMessage: Message = { id: `ask-${now}`, role: 'user', content: question, timestamp: now };
        dispatch({ type: 'DAILY_ASK_SENT', payload: userMessage });
        track('daily_ask_question', { count: dailyAsk.used + 1 });

        try {
            const history = [...dailyAsk.messages, userMessage].filter(m => m.role !== 'system');
            const answer = await converseWithFigure(history, currentFigure);
            dispatch({
                type: 'DAILY_ASK_ANSWERED',
                payload: { id: `ask-${Date.now()}-answer`, role: 'assistant', content: answer, timestamp: Date.now() },
            });

            const used = dailyAsk.used + 1;
            if (used >= DAILY_ASK_LIMIT) track('daily_ask_limit_reached');
            const next = setDailyQuestionsAsked(dailyStats, daily.dateKey, used);
            if (next !== dailyStats) {
                setDailyStats(next);
                saveDailyStats(next);
            }
        } catch (error) {
            console.error("Failed to get the figure's answer:", error);
            // reportAiFailure answers null once it has switched AI off; say so here without the Classic-mode framing.
            const message = reportAiFailure(error, 'converse') ?? 'The AI is not available right now.';
            dispatch({
                type: 'DAILY_ASK_FAILED',
                payload: { id: `ask-${Date.now()}-error`, role: 'system', content: message, timestamp: Date.now() },
            });
        }
    }, [aiAvailable, currentFigure, daily, dailyAsk, dailyStats, isDaily, reportAiFailure, roundOutcome]);

    const handleAskOpened = useCallback(() => {
        track('daily_ask_opened');
    }, []);

    const handleShared = useCallback((method: ShareMethod) => {
        track('share_clicked', { method });
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
        mode,
        aiStatus,
        aiAvailable,
        messages,
        questionsAsked,
        isTyping,
        showWelcome,
        showDocs,
        outOfQuestions,
        currentFigure,
        lastRoundBreakdown,
        lastRoundNumber,
        guessTokens,
        playKind,
        isDaily,
        daily,
        roundOutcome,
        dailyStats,
        todayKey,
        todayResult,
        dailyInProgress,
        dailyAsk,

        // Actions
        revealNextClue,
        handleAskQuestion,
        handleGuess,
        nextFigure,
        restartGame,
        handleStartGame,
        setMode,
        handleShowDocs,
        handleCloseDocs,
        resetConversation,
        handleValidationError,
        handleGiveUp,
        startDaily,
        startPractice,
        handleShared,
        askDailyFigure,
        handleAskOpened,

        // Constants
        QUESTION_LIMIT,
        DAILY_ASK_LIMIT,
    };
}
