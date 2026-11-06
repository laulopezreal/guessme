import { beforeEach, describe, expect, it } from 'vitest';
import { DAILY_PROGRESS_KEY, clearDailyProgress, loadDailyProgress, saveDailyProgress } from './dailyProgress';
import type { DailyProgress } from '../types';

const progress: DailyProgress = {
    version: 1,
    dateKey: '2026-11-04',
    revealed: [
        { text: 'I was born in England in 1533.', adaptive: false },
        { text: 'I never married and was known as the \'Virgin Queen\'.', adaptive: true },
    ],
    misses: 2,
};

describe('daily progress storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('round-trips an unfinished round for the same day', () => {
        saveDailyProgress(progress);
        expect(localStorage.getItem(DAILY_PROGRESS_KEY)).toContain('"version":1');
        expect(loadDailyProgress('2026-11-04')).toEqual(progress);
    });

    it('ignores a round saved for another day', () => {
        saveDailyProgress(progress);
        expect(loadDailyProgress('2026-11-05')).toBeNull();
    });

    it('returns null for missing, corrupt or malformed data', () => {
        expect(loadDailyProgress('2026-11-04')).toBeNull();

        localStorage.setItem(DAILY_PROGRESS_KEY, '{not json');
        expect(loadDailyProgress('2026-11-04')).toBeNull();

        localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify({ version: 1, dateKey: '2026-11-04', revealed: [{ text: 1 }], misses: 0 }));
        expect(loadDailyProgress('2026-11-04')).toBeNull();

        localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify({ ...progress, version: 2 }));
        expect(loadDailyProgress('2026-11-04')).toBeNull();
    });

    it('clears the saved round', () => {
        saveDailyProgress(progress);
        clearDailyProgress();
        expect(loadDailyProgress('2026-11-04')).toBeNull();
        expect(localStorage.getItem(DAILY_PROGRESS_KEY)).toBeNull();
    });
});
