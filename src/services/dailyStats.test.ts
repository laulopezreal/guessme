import { beforeEach, describe, expect, it } from 'vitest';
import {
    DAILY_STATS_KEY,
    emptyDailyStats,
    getDailyResult,
    loadDailyStats,
    recordDailyResult,
    saveDailyStats,
    setDailyQuestionsAsked,
    streakAsOf,
    winRate,
} from './dailyStats';
import type { DailyRecord } from '../types';

const result = (dateKey: string, won: boolean, cluesUsed = 2): DailyRecord => ({
    dateKey,
    dayNumber: 1,
    won,
    cluesUsed,
    totalClues: 5,
    score: won ? 90 : 0,
    misses: 0,
});

describe('recordDailyResult', () => {
    it('counts games, wins and the clue distribution', () => {
        let stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true, 1));
        stats = recordDailyResult(stats, result('2026-11-05', true, 3));
        stats = recordDailyResult(stats, result('2026-11-06', false, 5));

        expect(stats.played).toBe(3);
        expect(stats.won).toBe(2);
        expect(stats.distribution).toEqual({ '1': 1, '3': 1 });
        expect(winRate(stats)).toBe(67);
        expect(stats.lastPlayed).toBe('2026-11-06');
    });

    it('extends the streak on consecutive wins and resets it on a loss', () => {
        let stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        stats = recordDailyResult(stats, result('2026-11-05', true));
        expect(stats.currentStreak).toBe(2);
        expect(stats.bestStreak).toBe(2);

        stats = recordDailyResult(stats, result('2026-11-06', false));
        expect(stats.currentStreak).toBe(0);
        expect(stats.bestStreak).toBe(2);

        stats = recordDailyResult(stats, result('2026-11-07', true));
        expect(stats.currentStreak).toBe(1);
        expect(stats.bestStreak).toBe(2);
    });

    it('starts a new streak after a skipped day', () => {
        let stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        stats = recordDailyResult(stats, result('2026-11-06', true));
        expect(stats.currentStreak).toBe(1);
    });

    it('ignores a second result for the same day', () => {
        const stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        const again = recordDailyResult(stats, result('2026-11-04', false));

        expect(again).toBe(stats);
        expect(getDailyResult(again, '2026-11-04')?.won).toBe(true);
    });

    it('does not mutate the previous stats', () => {
        const before = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        const snapshot = JSON.stringify(before);
        recordDailyResult(before, result('2026-11-05', true, 4));
        expect(JSON.stringify(before)).toBe(snapshot);
    });
});

describe('streakAsOf', () => {
    it('keeps the streak alive until a whole day is missed', () => {
        const stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        expect(streakAsOf(stats, '2026-11-04')).toBe(1);
        expect(streakAsOf(stats, '2026-11-05')).toBe(1);
        expect(streakAsOf(stats, '2026-11-06')).toBe(0);
        expect(streakAsOf(emptyDailyStats(), '2026-11-06')).toBe(0);
    });
});

describe('setDailyQuestionsAsked', () => {
    it('stores the count on the day it belongs to without mutating the old stats', () => {
        const stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        const next = setDailyQuestionsAsked(stats, '2026-11-04', 2);
        expect(getDailyResult(next, '2026-11-04')?.questionsAsked).toBe(2);
        expect(getDailyResult(stats, '2026-11-04')?.questionsAsked).toBeUndefined();
    });

    it('leaves the stats alone for an unknown day or an unchanged count', () => {
        const stats = setDailyQuestionsAsked(recordDailyResult(emptyDailyStats(), result('2026-11-04', true)), '2026-11-04', 1);
        expect(setDailyQuestionsAsked(stats, '2026-11-05', 1)).toBe(stats);
        expect(setDailyQuestionsAsked(stats, '2026-11-04', 1)).toBe(stats);
    });
});

describe('localStorage persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('round-trips through the versioned key', () => {
        const stats = recordDailyResult(emptyDailyStats(), result('2026-11-04', true));
        expect(saveDailyStats(stats)).toBe(true);
        expect(localStorage.getItem(DAILY_STATS_KEY)).toContain('"version":1');
        expect(loadDailyStats()).toEqual(stats);
    });

    it('keeps the questions asked with the day', () => {
        const stats = setDailyQuestionsAsked(recordDailyResult(emptyDailyStats(), result('2026-11-04', true)), '2026-11-04', 3);
        saveDailyStats(stats);
        expect(getDailyResult(loadDailyStats(), '2026-11-04')?.questionsAsked).toBe(3);
    });

    it('falls back to empty stats for missing, corrupt or unknown data', () => {
        expect(loadDailyStats()).toEqual(emptyDailyStats());

        localStorage.setItem(DAILY_STATS_KEY, '{not json');
        expect(loadDailyStats()).toEqual(emptyDailyStats());

        localStorage.setItem(DAILY_STATS_KEY, JSON.stringify({ version: 99 }));
        expect(loadDailyStats()).toEqual(emptyDailyStats());
    });
});
