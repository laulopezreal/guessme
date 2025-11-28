import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameReducer, initialState, type GameState } from '../reducers/gameReducer';
import type { HistoricFigure, Clue, Message } from '../types';

// Mock the llmService
vi.mock('../services/llmService', () => ({
    isLLMConfigured: vi.fn(() => false),
}));

describe('gameReducer', () => {
    let state: GameState;
    const mockFigures: HistoricFigure[] = [
        {
            name: 'Albert Einstein',
            alternateNames: ['Einstein'],
            clues: [
                { text: 'Physicist', difficulty: 'easy' },
                { text: 'Theory of Relativity', difficulty: 'medium' },
            ],
            voiceLine: 'E=mc²',
        },
        {
            name: 'Marie Curie',
            alternateNames: ['Curie'],
            clues: [
                { text: 'Chemist', difficulty: 'easy' },
                { text: 'Radioactivity', difficulty: 'medium' },
            ],
            voiceLine: 'Science is my passion',
        },
    ];

    beforeEach(() => {
        state = { ...initialState };
    });

    describe('INIT_GAME', () => {
        it('should initialize game with figures', () => {
            const newState = gameReducer(state, {
                type: 'INIT_GAME',
                payload: { figures: mockFigures },
            });

            expect(newState.shuffledFigures).toEqual(mockFigures);
            expect(newState.currentFigureIndex).toBe(0);
            expect(newState.score).toBe(0);
            expect(newState.round).toBe(1);
            expect(newState.gameEnded).toBe(false);
        });

        it('should reset all game state', () => {
            const dirtyState: GameState = {
                ...state,
                score: 100,
                round: 5,
                revealedClues: [{ text: 'Old clue', difficulty: 'easy' }],
                consecutiveMisses: 3,
                feedbackMessage: 'Old feedback',
            };

            const newState = gameReducer(dirtyState, {
                type: 'INIT_GAME',
                payload: { figures: mockFigures },
            });

            expect(newState.score).toBe(0);
            expect(newState.round).toBe(1);
            expect(newState.revealedClues).toEqual([]);
            expect(newState.consecutiveMisses).toBe(0);
            expect(newState.feedbackMessage).toBe('');
        });
    });

    describe('START_GAME', () => {
        it('should hide welcome modal', () => {
            const stateWithWelcome: GameState = {
                ...state,
                showWelcome: true,
            };

            const newState = gameReducer(stateWithWelcome, { type: 'START_GAME' });

            expect(newState.showWelcome).toBe(false);
        });
    });

    describe('RESTART_GAME', () => {
        it('should reset to initial state with new figures', () => {
            const dirtyState: GameState = {
                ...state,
                score: 200,
                round: 10,
                currentFigureIndex: 5,
                llmMode: true,
            };

            const newState = gameReducer(dirtyState, {
                type: 'RESTART_GAME',
                payload: { figures: mockFigures },
            });

            expect(newState.shuffledFigures).toEqual(mockFigures);
            expect(newState.score).toBe(0);
            expect(newState.round).toBe(1);
            expect(newState.currentFigureIndex).toBe(0);
            expect(newState.showWelcome).toBe(false); // Should not show welcome on restart
            expect(newState.llmMode).toBe(true); // Should preserve LLM mode
        });
    });

    describe('NEXT_FIGURE', () => {
        it('should advance to next figure', () => {
            const stateWithFigures: GameState = {
                ...state,
                shuffledFigures: mockFigures,
                currentFigureIndex: 0,
                round: 1,
                revealedClues: [{ text: 'Old clue', difficulty: 'easy' }],
                consecutiveMisses: 2,
            };

            const newState = gameReducer(stateWithFigures, { type: 'NEXT_FIGURE' });

            expect(newState.currentFigureIndex).toBe(1);
            expect(newState.round).toBe(2);
            expect(newState.revealedClues).toEqual([]);
            expect(newState.consecutiveMisses).toBe(0);
        });

        it('should end game when no more figures', () => {
            const stateAtEnd: GameState = {
                ...state,
                shuffledFigures: mockFigures,
                currentFigureIndex: 1, // Last figure (index 1 of 2 figures)
            };

            const newState = gameReducer(stateAtEnd, { type: 'NEXT_FIGURE' });

            expect(newState.gameEnded).toBe(true);
        });

        it('should reset round-specific state', () => {
            const stateWithData: GameState = {
                ...state,
                shuffledFigures: mockFigures,
                currentFigureIndex: 0,
                messages: [{ id: '1', role: 'user', content: 'test', timestamp: 123 }],
                questionsAsked: 5,
                feedbackMessage: 'Old feedback',
                personaLine: 'Old line',
                isRevealed: true,
                inputDisabled: true,
                showNextButton: true,
                adaptiveHintNotice: 'Old notice',
                outOfQuestions: true,
            };

            const newState = gameReducer(stateWithData, { type: 'NEXT_FIGURE' });

            expect(newState.messages).toEqual([]);
            expect(newState.questionsAsked).toBe(0);
            expect(newState.feedbackMessage).toBe('');
            expect(newState.personaLine).toBe('');
            expect(newState.isRevealed).toBe(false);
            expect(newState.inputDisabled).toBe(false);
            expect(newState.showNextButton).toBe(false);
            expect(newState.adaptiveHintNotice).toBe('');
            expect(newState.outOfQuestions).toBe(false);
        });
    });

    describe('TOGGLE_DOCS', () => {
        it('should show documentation', () => {
            const newState = gameReducer(state, {
                type: 'TOGGLE_DOCS',
                payload: true,
            });

            expect(newState.showDocs).toBe(true);
        });

        it('should hide documentation', () => {
            const stateWithDocs: GameState = { ...state, showDocs: true };
            const newState = gameReducer(stateWithDocs, {
                type: 'TOGGLE_DOCS',
                payload: false,
            });

            expect(newState.showDocs).toBe(false);
        });
    });

    describe('REVEAL_CLUE', () => {
        it('should add clue to revealed clues', () => {
            const clue: Clue = { text: 'New clue', difficulty: 'medium' };
            const newState = gameReducer(state, {
                type: 'REVEAL_CLUE',
                payload: { clue },
            });

            expect(newState.revealedClues).toHaveLength(1);
            expect(newState.revealedClues[0].text).toBe('New clue');
        });

        it('should mark adaptive clues', () => {
            const clue: Clue = { text: 'Adaptive clue', difficulty: 'easy' };
            const newState = gameReducer(state, {
                type: 'REVEAL_CLUE',
                payload: { clue, isAdaptive: true },
            });

            expect(newState.revealedClues[0].isAdaptive).toBe(true);
        });

        it('should set adaptive hint notice', () => {
            const clue: Clue = { text: 'Clue', difficulty: 'easy' };
            const notice = 'This is an adaptive hint';
            const newState = gameReducer(state, {
                type: 'REVEAL_CLUE',
                payload: { clue, isAdaptive: true, adaptiveNotice: notice },
            });

            expect(newState.adaptiveHintNotice).toBe(notice);
        });

        it('should preserve existing adaptive hint notice if not provided', () => {
            const stateWithNotice: GameState = {
                ...state,
                adaptiveHintNotice: 'Existing notice',
            };
            const clue: Clue = { text: 'Clue', difficulty: 'easy' };
            const newState = gameReducer(stateWithNotice, {
                type: 'REVEAL_CLUE',
                payload: { clue },
            });

            expect(newState.adaptiveHintNotice).toBe('Existing notice');
        });
    });

    describe('REGISTER_MISS', () => {
        it('should increment consecutive misses', () => {
            const newState = gameReducer(state, {
                type: 'REGISTER_MISS',
                payload: { feedback: 'Wrong!' },
            });

            expect(newState.consecutiveMisses).toBe(1);
        });

        it('should set error feedback', () => {
            const newState = gameReducer(state, {
                type: 'REGISTER_MISS',
                payload: { feedback: 'Try again!' },
            });

            expect(newState.feedbackMessage).toBe('Try again!');
            expect(newState.feedbackType).toBe('error');
        });

        it('should trigger shake animation', () => {
            const newState = gameReducer(state, {
                type: 'REGISTER_MISS',
                payload: { feedback: 'Wrong!', triggerShake: true },
            });

            expect(newState.triggerShake).toBe(true);
        });

        it('should accumulate misses', () => {
            let newState = gameReducer(state, {
                type: 'REGISTER_MISS',
                payload: { feedback: 'Wrong 1' },
            });
            newState = gameReducer(newState, {
                type: 'REGISTER_MISS',
                payload: { feedback: 'Wrong 2' },
            });
            newState = gameReducer(newState, {
                type: 'REGISTER_MISS',
                payload: { feedback: 'Wrong 3' },
            });

            expect(newState.consecutiveMisses).toBe(3);
        });
    });

    describe('CORRECT_GUESS', () => {
        it('should add score delta to total score', () => {
            const stateWithScore: GameState = { ...state, score: 50 };
            const newState = gameReducer(stateWithScore, {
                type: 'CORRECT_GUESS',
                payload: { scoreDelta: 75, feedback: 'Correct!' },
            });

            expect(newState.score).toBe(125);
        });

        it('should set success feedback', () => {
            const newState = gameReducer(state, {
                type: 'CORRECT_GUESS',
                payload: { scoreDelta: 100, feedback: 'Well done!' },
            });

            expect(newState.feedbackMessage).toBe('Well done!');
            expect(newState.feedbackType).toBe('success');
        });

        it('should reveal the figure and disable input', () => {
            const newState = gameReducer(state, {
                type: 'CORRECT_GUESS',
                payload: { scoreDelta: 100, feedback: 'Correct!' },
            });

            expect(newState.isRevealed).toBe(true);
            expect(newState.inputDisabled).toBe(true);
            expect(newState.showNextButton).toBe(true);
        });

        it('should set persona voice line', () => {
            const newState = gameReducer(state, {
                type: 'CORRECT_GUESS',
                payload: {
                    scoreDelta: 100,
                    feedback: 'Correct!',
                    voiceLine: 'E=mc²',
                },
            });

            expect(newState.personaLine).toBe('E=mc²');
        });

        it('should reset consecutive misses', () => {
            const stateWithMisses: GameState = { ...state, consecutiveMisses: 5 };
            const newState = gameReducer(stateWithMisses, {
                type: 'CORRECT_GUESS',
                payload: { scoreDelta: 50, feedback: 'Correct!' },
            });

            expect(newState.consecutiveMisses).toBe(0);
        });

        it('should clear adaptive hint notice', () => {
            const stateWithNotice: GameState = {
                ...state,
                adaptiveHintNotice: 'Old notice',
            };
            const newState = gameReducer(stateWithNotice, {
                type: 'CORRECT_GUESS',
                payload: { scoreDelta: 100, feedback: 'Correct!' },
            });

            expect(newState.adaptiveHintNotice).toBe('');
        });

        it('should reset out of questions flag', () => {
            const stateOutOfQuestions: GameState = { ...state, outOfQuestions: true };
            const newState = gameReducer(stateOutOfQuestions, {
                type: 'CORRECT_GUESS',
                payload: { scoreDelta: 100, feedback: 'Correct!' },
            });

            expect(newState.outOfQuestions).toBe(false);
        });
    });

    describe('SET_FEEDBACK', () => {
        it('should set error feedback', () => {
            const newState = gameReducer(state, {
                type: 'SET_FEEDBACK',
                payload: { message: 'Error occurred', type: 'error' },
            });

            expect(newState.feedbackMessage).toBe('Error occurred');
            expect(newState.feedbackType).toBe('error');
        });

        it('should set success feedback', () => {
            const newState = gameReducer(state, {
                type: 'SET_FEEDBACK',
                payload: { message: 'Success!', type: 'success' },
            });

            expect(newState.feedbackMessage).toBe('Success!');
            expect(newState.feedbackType).toBe('success');
        });

        it('should clear feedback', () => {
            const stateWithFeedback: GameState = {
                ...state,
                feedbackMessage: 'Old message',
                feedbackType: 'error',
            };
            const newState = gameReducer(stateWithFeedback, {
                type: 'SET_FEEDBACK',
                payload: { message: '', type: '' },
            });

            expect(newState.feedbackMessage).toBe('');
            expect(newState.feedbackType).toBe('');
        });
    });

    describe('CLEAR_SHAKE', () => {
        it('should clear shake trigger', () => {
            const stateWithShake: GameState = { ...state, triggerShake: true };
            const newState = gameReducer(stateWithShake, { type: 'CLEAR_SHAKE' });

            expect(newState.triggerShake).toBe(false);
        });
    });

    describe('ADD_MESSAGE', () => {
        it('should add user message and increment questions', () => {
            const message: Message = {
                id: '1',
                role: 'user',
                content: 'What is your name?',
                timestamp: Date.now(),
            };

            const newState = gameReducer(state, {
                type: 'ADD_MESSAGE',
                payload: message,
            });

            expect(newState.messages).toHaveLength(1);
            expect(newState.messages[0]).toEqual(message);
            expect(newState.questionsAsked).toBe(1);
        });

        it('should add assistant message without incrementing questions', () => {
            const message: Message = {
                id: '2',
                role: 'assistant',
                content: 'I am Einstein',
                timestamp: Date.now(),
            };

            const newState = gameReducer(state, {
                type: 'ADD_MESSAGE',
                payload: message,
            });

            expect(newState.messages).toHaveLength(1);
            expect(newState.messages[0]).toEqual(message);
            expect(newState.questionsAsked).toBe(0);
        });

        it('should append to existing messages', () => {
            const stateWithMessages: GameState = {
                ...state,
                messages: [
                    { id: '1', role: 'user', content: 'First', timestamp: 100 },
                ],
                questionsAsked: 1,
            };

            const newMessage: Message = {
                id: '2',
                role: 'assistant',
                content: 'Second',
                timestamp: 200,
            };

            const newState = gameReducer(stateWithMessages, {
                type: 'ADD_MESSAGE',
                payload: newMessage,
            });

            expect(newState.messages).toHaveLength(2);
            expect(newState.questionsAsked).toBe(1); // Should not increment for assistant
        });
    });

    describe('SET_IS_TYPING', () => {
        it('should set typing to true', () => {
            const newState = gameReducer(state, {
                type: 'SET_IS_TYPING',
                payload: true,
            });

            expect(newState.isTyping).toBe(true);
        });

        it('should set typing to false', () => {
            const stateTyping: GameState = { ...state, isTyping: true };
            const newState = gameReducer(stateTyping, {
                type: 'SET_IS_TYPING',
                payload: false,
            });

            expect(newState.isTyping).toBe(false);
        });
    });

    describe('SET_OUT_OF_QUESTIONS', () => {
        it('should set out of questions flag', () => {
            const newState = gameReducer(state, {
                type: 'SET_OUT_OF_QUESTIONS',
                payload: true,
            });

            expect(newState.outOfQuestions).toBe(true);
        });

        it('should clear out of questions flag', () => {
            const stateOutOfQuestions: GameState = { ...state, outOfQuestions: true };
            const newState = gameReducer(stateOutOfQuestions, {
                type: 'SET_OUT_OF_QUESTIONS',
                payload: false,
            });

            expect(newState.outOfQuestions).toBe(false);
        });
    });

    describe('RESET_CONVERSATION', () => {
        it('should reset conversation with initial message', () => {
            const initialMessage: Message = {
                id: 'greeting',
                role: 'assistant',
                content: 'Hello!',
                timestamp: Date.now(),
            };

            const stateWithConversation: GameState = {
                ...state,
                messages: [
                    { id: '1', role: 'user', content: 'Question', timestamp: 100 },
                    { id: '2', role: 'assistant', content: 'Answer', timestamp: 200 },
                ],
                questionsAsked: 5,
                feedbackMessage: 'Old feedback',
                feedbackType: 'error',
                outOfQuestions: true,
            };

            const newState = gameReducer(stateWithConversation, {
                type: 'RESET_CONVERSATION',
                payload: { initialMessage },
            });

            expect(newState.messages).toEqual([initialMessage]);
            expect(newState.questionsAsked).toBe(0);
            expect(newState.feedbackMessage).toBe('');
            expect(newState.feedbackType).toBe('');
            expect(newState.outOfQuestions).toBe(false);
        });

        it('should reset conversation without initial message', () => {
            const stateWithConversation: GameState = {
                ...state,
                messages: [
                    { id: '1', role: 'user', content: 'Question', timestamp: 100 },
                ],
                questionsAsked: 3,
            };

            const newState = gameReducer(stateWithConversation, {
                type: 'RESET_CONVERSATION',
                payload: {},
            });

            expect(newState.messages).toEqual([]);
            expect(newState.questionsAsked).toBe(0);
        });
    });

    describe('SET_MESSAGES', () => {
        it('should replace all messages', () => {
            const newMessages: Message[] = [
                { id: '1', role: 'user', content: 'New 1', timestamp: 100 },
                { id: '2', role: 'assistant', content: 'New 2', timestamp: 200 },
            ];

            const stateWithMessages: GameState = {
                ...state,
                messages: [
                    { id: 'old', role: 'user', content: 'Old', timestamp: 50 },
                ],
            };

            const newState = gameReducer(stateWithMessages, {
                type: 'SET_MESSAGES',
                payload: newMessages,
            });

            expect(newState.messages).toEqual(newMessages);
        });
    });

    describe('GIVE_UP', () => {
        it('should reveal answer and disable input', () => {
            const stateWithFigure: GameState = {
                ...state,
                shuffledFigures: mockFigures,
                currentFigureIndex: 0,
            };

            const newState = gameReducer(stateWithFigure, { type: 'GIVE_UP' });

            expect(newState.isRevealed).toBe(true);
            expect(newState.inputDisabled).toBe(true);
            expect(newState.showNextButton).toBe(true);
            expect(newState.feedbackMessage).toContain('Albert Einstein');
            expect(newState.feedbackType).toBe('error');
        });

        it('should reset round state', () => {
            const stateWithData: GameState = {
                ...state,
                shuffledFigures: mockFigures,
                currentFigureIndex: 0,
                consecutiveMisses: 5,
                adaptiveHintNotice: 'Notice',
                outOfQuestions: true,
            };

            const newState = gameReducer(stateWithData, { type: 'GIVE_UP' });

            expect(newState.consecutiveMisses).toBe(0);
            expect(newState.adaptiveHintNotice).toBe('');
            expect(newState.outOfQuestions).toBe(false);
        });
    });
});
