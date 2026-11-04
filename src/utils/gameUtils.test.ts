import { describe, expect, it } from 'vitest';
import {
    DAILY_EPOCH,
    buildDailyShareText,
    dailyNumber,
    dailyResultGrid,
    formatCountdown,
    getDailyPuzzle,
    hashString,
    msUntilNextUtcDay,
    selectDailyFigure,
    shiftDateKey,
    utcDateKey,
} from './gameUtils';

const roster = [
    'Einstein', 'Curie', 'da Vinci', 'Shakespeare', 'Tesla',
    'Galileo', 'Newton', 'Napoleon', 'Joan of Arc', 'Elizabeth I',
];

const dayOffset = (days: number) => shiftDateKey(DAILY_EPOCH, days);

describe('utcDateKey', () => {
    it('uses the UTC calendar date, not the local one', () => {
        expect(utcDateKey(new Date('2026-11-04T23:59:59Z'))).toBe('2026-11-04');
        expect(utcDateKey(new Date('2026-11-05T00:00:00Z'))).toBe('2026-11-05');
    });
});

describe('dailyNumber', () => {
    it('numbers the epoch day 1 and counts up from there', () => {
        expect(dailyNumber(DAILY_EPOCH)).toBe(1);
        expect(dailyNumber(dayOffset(1))).toBe(2);
        expect(dailyNumber(dayOffset(365))).toBe(366);
    });

    it('survives month and year boundaries', () => {
        expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01');
        expect(shiftDateKey('2027-03-01', -1)).toBe('2027-02-28');
        expect(dailyNumber('2027-01-01', '2026-12-31')).toBe(2);
    });
});

describe('msUntilNextUtcDay', () => {
    it('counts down to the next UTC midnight', () => {
        expect(msUntilNextUtcDay(new Date('2026-11-04T23:59:00Z'))).toBe(60_000);
        expect(msUntilNextUtcDay(new Date('2026-11-04T00:00:00Z'))).toBe(86_400_000);
    });
});

describe('hashString', () => {
    it('is deterministic and tells nearby inputs apart', () => {
        expect(hashString('2026-11-04')).toBe(hashString('2026-11-04'));
        expect(hashString('2026-11-04')).not.toBe(hashString('2026-11-05'));
    });
});

describe('selectDailyFigure', () => {
    it('gives the same figure for the same date, whatever array instance holds the roster', () => {
        expect(selectDailyFigure('2026-11-10', roster)).toBe(selectDailyFigure('2026-11-10', [...roster]));
    });

    it('uses every figure once before any repeats', () => {
        for (let cycle = 0; cycle < 5; cycle++) {
            const picks = roster.map((_, offset) => selectDailyFigure(dayOffset(cycle * roster.length + offset), roster));
            expect(new Set(picks).size).toBe(roster.length);
        }
    });

    it('never shows the same figure two days in a row', () => {
        let previous = selectDailyFigure(DAILY_EPOCH, roster);
        for (let day = 1; day < roster.length * 20; day++) {
            const next = selectDailyFigure(dayOffset(day), roster);
            expect(next).not.toBe(previous);
            previous = next;
        }
    });

    it('shuffles each cycle differently', () => {
        const cycleOf = (cycle: number) =>
            roster.map((_, offset) => selectDailyFigure(dayOffset(cycle * roster.length + offset), roster));
        expect(cycleOf(0)).not.toEqual(cycleOf(1));
        expect(cycleOf(1)).not.toEqual(cycleOf(2));
    });

    it('copes with dates before the epoch and with an empty roster', () => {
        expect(roster).toContain(selectDailyFigure(dayOffset(-3), roster));
        expect(selectDailyFigure(DAILY_EPOCH, [])).toBeUndefined();
    });
});

describe('getDailyPuzzle', () => {
    it('bundles the date key, puzzle number and figure', () => {
        const puzzle = getDailyPuzzle(roster, new Date('2026-11-05T12:00:00Z'));
        expect(puzzle).toEqual({
            dateKey: '2026-11-05',
            dayNumber: 2,
            figure: selectDailyFigure('2026-11-05', roster),
        });
        expect(getDailyPuzzle([], new Date('2026-11-05T12:00:00Z'))).toBeNull();
    });
});

describe('buildDailyShareText', () => {
    it('draws one square per clue revealed and a tick for a win', () => {
        expect(buildDailyShareText({ dayNumber: 12, won: true, cluesUsed: 3, totalClues: 5, score: 80, url: 'https://guessme.example' }))
            .toBe('Who Am I? #12 · 3/5 clues\n🟦🟦🟦⬜⬜ ✅ 80 pts\nhttps://guessme.example');
    });

    it('marks a give-up with a cross', () => {
        expect(buildDailyShareText({ dayNumber: 3, won: false, cluesUsed: 5, totalClues: 5, score: 0, url: 'https://guessme.example' }))
            .toBe('Who Am I? #3 · gave up\n🟦🟦🟦🟦🟦 ❌ 0 pts\nhttps://guessme.example');
    });
});

describe('formatCountdown', () => {
    it('formats hours, minutes and seconds with leading zeros', () => {
        expect(formatCountdown(0)).toBe('00:00:00');
        expect(formatCountdown(3_723_000)).toBe('01:02:03');
        expect(formatCountdown(86_399_999)).toBe('23:59:59');
    });
});

describe('dailyResultGrid', () => {
    it('clamps the clue count to the clues that exist', () => {
        expect(dailyResultGrid(1, 5, true)).toBe('🟦⬜⬜⬜⬜ ✅');
        expect(dailyResultGrid(7, 5, false)).toBe('🟦🟦🟦🟦🟦 ❌');
        expect(dailyResultGrid(0, 3, false)).toBe('⬜⬜⬜ ❌');
    });
});
