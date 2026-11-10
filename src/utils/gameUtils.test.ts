import { describe, expect, it } from 'vitest';
import { allFigures } from '../data/figuresConfig';
import {
    DAILY_EPOCH,
    type DailyEntry,
    buildDailyShareText,
    dailyNumber,
    dailyResultGrid,
    formatCountdown,
    getDailyPuzzle,
    hashString,
    isCloseMatch,
    isCorrectGuess,
    msUntilNextUtcDay,
    selectDailyFigure,
    shiftDateKey,
    utcDateKey,
    figureShortName,
} from './gameUtils';

interface TestFigure extends DailyEntry {
    name: string;
}

const figure = (name: string, overrides: Partial<DailyEntry> = {}): TestFigure => ({
    name,
    dailyFrom: DAILY_EPOCH,
    enabled: true,
    ...overrides,
});

const roster = [
    'Einstein', 'Curie', 'da Vinci', 'Shakespeare', 'Tesla',
    'Galileo', 'Newton', 'Napoleon', 'Joan of Arc', 'Elizabeth I',
].map(name => figure(name));

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

describe('selectDailyFigure when the roster changes', () => {
    const namesFor = (list: readonly TestFigure[], firstDay: number, days: number) =>
        Array.from({ length: days }, (_, offset) => selectDailyFigure(dayOffset(firstDay + offset), list)?.name);

    const firstCycle = namesFor(roster, 0, roster.length);
    // Added on day 3, while the first cycle is in progress.
    const newcomer = figure('Lovelace', { dailyFrom: dayOffset(3) });

    it('leaves the cycle in progress alone when a figure is added', () => {
        expect(namesFor([...roster, newcomer], 0, roster.length)).toEqual(firstCycle);
    });

    it('does not mind where in the array the new figure lands', () => {
        const inserted = [...roster.slice(0, 4), newcomer, ...roster.slice(4)];
        expect(namesFor(inserted, 0, roster.length)).toEqual(firstCycle);
    });

    it('brings the new figure in with the next cycle, once, and lengthens later cycles', () => {
        const longer = [...roster, newcomer];
        const secondCycle = namesFor(longer, roster.length, longer.length);
        expect(new Set(secondCycle).size).toBe(longer.length);
        expect(secondCycle).toContain('Lovelace');

        const thirdCycle = namesFor(longer, roster.length + longer.length, longer.length);
        expect(new Set(thirdCycle).size).toBe(longer.length);
    });

    it('lets a figure dated on a cycle start join that cycle, and one dated a day later wait', () => {
        const onTheDay = figure('Lovelace', { dailyFrom: dayOffset(roster.length) });
        const dayLater = figure('Lovelace', { dailyFrom: dayOffset(roster.length + 1) });
        expect(namesFor([...roster, onTheDay], roster.length, roster.length + 1)).toContain('Lovelace');
        expect(namesFor([...roster, dayLater], roster.length, roster.length)).not.toContain('Lovelace');
    });

    it('never runs a figure two days in a row as the roster grows', () => {
        const growing = [
            ...roster,
            newcomer,
            figure('Turing', { dailyFrom: dayOffset(12) }),
            figure('Hopper', { dailyFrom: dayOffset(40) }),
        ];
        const days = namesFor(growing, 0, 500);
        days.forEach((name, day) => {
            if (day > 0) expect(name).not.toBe(days[day - 1]);
        });
    });

    it('moves only the days of a disabled figure', () => {
        const pulled = 'Tesla';
        const list = roster.map(entry => (entry.name === pulled ? { ...entry, enabled: false } : entry));
        const before = namesFor(roster, 0, roster.length * 5);
        const after = namesFor(list, 0, roster.length * 5);
        after.forEach((name, day) => {
            if (before[day] === pulled) {
                expect(name).toBeDefined();
                expect(name).not.toBe(pulled);
            } else {
                expect(name).toBe(before[day]);
            }
        });
    });

    it('gives a disabled figure a stand-in that does not touch its neighbouring days', () => {
        const list = roster.map(entry => (entry.name === 'Tesla' ? { ...entry, enabled: false } : entry));
        const days = namesFor(list, 0, roster.length);
        days.forEach((name, day) => {
            if (day > 0) expect(name).not.toBe(days[day - 1]);
        });
    });

    it('follows a rename without moving anyone', () => {
        const renamed = roster.map(entry => (entry.name === 'Einstein' ? { ...entry, name: 'A. Einstein' } : entry));
        const expected = firstCycle.map(name => (name === 'Einstein' ? 'A. Einstein' : name));
        expect(namesFor(renamed, 0, roster.length)).toEqual(expected);
    });

    it('has nothing to schedule when every figure is disabled or none has arrived', () => {
        const disabled = roster.map(entry => ({ ...entry, enabled: false }));
        expect(selectDailyFigure(DAILY_EPOCH, disabled)).toBeUndefined();
        expect(getDailyPuzzle(disabled, new Date('2026-11-05T12:00:00Z'))).toBeNull();
        expect(selectDailyFigure(dayOffset(20), [figure('Lovelace', { dailyFrom: dayOffset(5) })])).toBeUndefined();
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

describe('figureShortName', () => {
    it('uses the first name and skips a leading title', () => {
        expect(figureShortName('Marie Curie')).toBe('Marie');
        expect(figureShortName('Leonardo da Vinci')).toBe('Leonardo');
        expect(figureShortName('Queen Elizabeth I')).toBe('Elizabeth');
        expect(figureShortName('Cleopatra')).toBe('Cleopatra');
    });

    it('skips honorifics that read like a first name', () => {
        expect(figureShortName('Mansa Musa')).toBe('Musa');
        expect(figureShortName('Mahatma Gandhi')).toBe('Gandhi');
    });

    it('keeps "Ibn" with the name it belongs to', () => {
        expect(figureShortName('Ibn Battuta')).toBe('Ibn Battuta');
        expect(figureShortName('Ibn')).toBe('Ibn');
    });

    it('falls back to the whole name when every word is a title', () => {
        expect(figureShortName('Pope')).toBe('Pope');
    });
});

/** Classic mode's win check against a figure on the roster. */
function solves(guess: string, figureName: string): boolean {
    const figure = allFigures.find(candidate => candidate.name === figureName);
    if (!figure) throw new Error(`No figure named ${figureName}`);
    return isCorrectGuess(guess, figure);
}

describe('isCloseMatch', () => {
    it('accepts exact matches regardless of case and surrounding whitespace', () => {
        expect(isCloseMatch('  Albert Einstein ', 'albert einstein')).toBe(true);
        expect(isCloseMatch('QUEEN ELIZABETH I', 'queen elizabeth i')).toBe(true);
    });

    it('accepts a distinctive part of the answer', () => {
        expect(isCloseMatch('elizabeth', 'queen elizabeth i')).toBe(true);
        expect(isCloseMatch('Einstein', 'Albert Einstein')).toBe(true);
    });

    it("accepts a guess that adds words of the figure's names to the whole answer", () => {
        expect(isCloseMatch('Albert Einstein', 'einstein', { figureNames: ['Albert Einstein', 'einstein'] })).toBe(true);
        expect(isCloseMatch('queen elizabeth the first', 'elizabeth', { figureNames: ['Queen Elizabeth I', 'elizabeth'] })).toBe(true);
    });

    it("rejects a guess that adds a word of someone else's name to the answer", () => {
        expect(isCloseMatch('Marie Antoinette', 'marie', { figureNames: ['Marie Curie', 'marie'] })).toBe(false);
        expect(isCloseMatch('Elizabeth II', 'elizabeth', { figureNames: ['Queen Elizabeth I', 'elizabeth'] })).toBe(false);
        // Without the figure's names, only the answer's own words count.
        expect(isCloseMatch('Albert Einstein', 'einstein')).toBe(false);
    });

    it('rejects titles and epithets on their own', () => {
        expect(isCloseMatch('queen', 'queen elizabeth i')).toBe(false);
        expect(isCloseMatch('Great', 'alexander the great')).toBe(false);
        expect(isCloseMatch('the great', 'catherine the great')).toBe(false);
        expect(isCloseMatch('king', 'martin luther king jr.')).toBe(false);
        expect(isCloseMatch('king jr', 'martin luther king jr.')).toBe(false);
        expect(isCloseMatch('magnificent', 'suleiman the magnificent')).toBe(false);
    });

    it('rejects a guess that is only a stopword even when it contains the answer', () => {
        expect(isCloseMatch('the queen of england', 'queen')).toBe(false);
    });

    it('tolerates small typos', () => {
        expect(isCloseMatch('Einstien', 'einstein')).toBe(true);
        expect(isCloseMatch('Shakespear', 'shakespeare')).toBe(true);
    });

    it('rejects unrelated and very short guesses', () => {
        expect(isCloseMatch('newton', 'albert einstein')).toBe(false);
        expect(isCloseMatch('abc', 'albert einstein')).toBe(false);
        expect(isCloseMatch('', 'albert einstein')).toBe(false);
    });

    it('accepts part of an answer only as whole words', () => {
        expect(isCloseMatch('nightingale', 'florence nightingale')).toBe(true);
        expect(isCloseMatch('luther king', 'martin luther king jr.')).toBe(true);
        expect(isCloseMatch('night', 'florence nightingale')).toBe(false);
        expect(isCloseMatch('ander', 'alexander the great')).toBe(false);
    });

    it('refuses part of an answer that must be typed in full, typos allowed', () => {
        expect(isCloseMatch('russia', 'catherine ii of russia', { allowPart: false })).toBe(false);
        expect(isCloseMatch('Catherine II of Russia', 'catherine ii of russia', { allowPart: false })).toBe(true);
        expect(isCloseMatch('Catherine II of Rusia', 'catherine ii of russia', { allowPart: false })).toBe(true);
    });

    it('accepts a guess that contains the answer only as whole words', () => {
        expect(isCloseMatch('Anne Frank', 'frank', { figureNames: ['Anne Frank', 'frank'] })).toBe(true);
        expect(isCloseMatch('Benjamin Franklin', 'frank')).toBe(false);
        expect(isCloseMatch('planned', 'anne')).toBe(false);
    });

    it('ignores punctuation, curly apostrophes and a leading "the"', () => {
        expect(isCloseMatch('Wu.', 'wu')).toBe(true);
        expect(isCloseMatch('Martin Luther King, Jr.', 'martin luther king jr.')).toBe(true);
        expect(isCloseMatch('Jeanne d’Arc', "jeanne d'arc")).toBe(true);
        expect(isCloseMatch('Simón Bolívar'.normalize('NFD'), 'simón bolívar')).toBe(true);
        expect(isCloseMatch('Lady with the Lamp', 'the lady with the lamp')).toBe(true);
        expect(isCloseMatch('Liberator', 'the liberator')).toBe(true);
    });

    it('never lets titles and stopwords alone win as a near spelling', () => {
        // "empress" is only three letters short of "empress wu".
        expect(isCloseMatch('empress', 'empress wu')).toBe(false);
        expect(isCloseMatch('Empress Wu', 'empress wu')).toBe(true);
    });

    it('wants the first letter right in a near spelling of a short answer', () => {
        expect(isCloseMatch('During', 'turing')).toBe(false);
        expect(isCloseMatch('shares', 'charles')).toBe(false);
        expect(isCloseMatch('Turnig', 'turing')).toBe(true);
        expect(isCloseMatch('Charls', 'charles')).toBe(true);
        // Answers of eight or more characters forgive a wrong first letter.
        expect(isCloseMatch('Ainstein', 'einstein')).toBe(true);
    });

    it('wants the same ordinal in a near spelling', () => {
        expect(isCloseMatch('Elizabth I', 'elizabeth i')).toBe(true);
        expect(isCloseMatch('Elizabeth 1', 'elizabeth i')).toBe(true);
        expect(isCloseMatch('Elizabeth II', 'elizabeth i')).toBe(false);
        expect(isCloseMatch('Montezuma I', 'montezuma ii')).toBe(false);
    });
});

describe('isCorrectGuess', () => {
    it('accepts part of the name but wants an alternate name in full', () => {
        expect(solves('Vinci', 'Leonardo da Vinci')).toBe(true);
        expect(solves('Luther', 'Martin Luther King Jr.')).toBe(true);
        expect(solves('Catherine II of Russia', 'Catherine the Great')).toBe(true);
        expect(solves('Elizabeth Tudor', 'Queen Elizabeth I')).toBe(true);
        expect(solves('Russia', 'Catherine the Great')).toBe(false);
        expect(solves('Lawgiver', 'Suleiman the Magnificent')).toBe(false);
        expect(solves('Tudor', 'Queen Elizabeth I')).toBe(false);
    });

    it('still accepts a place or title alternate typed in full', () => {
        expect(solves('Alexander of Macedon', 'Alexander the Great')).toBe(true);
        expect(solves('Sultan Suleiman', 'Suleiman the Magnificent')).toBe(true);
        expect(solves('The Lady with the Lamp', 'Florence Nightingale')).toBe(true);
        expect(solves('Lady with the Lamp', 'Florence Nightingale')).toBe(true);
    });

    it('accepts the short forms listed as alternate names', () => {
        expect(solves('Jeanne', 'Joan of Arc')).toBe(true);
        expect(solves('Mohandas', 'Mahatma Gandhi')).toBe(true);
        expect(solves('Cleo', 'Cleopatra')).toBe(true);
    });

    it('does not let a word that only resembles a name win', () => {
        expect(solves('hats', 'Hatshepsut')).toBe(false);
        expect(solves('with', 'Florence Nightingale')).toBe(false);
        expect(solves('Benjamin Franklin', 'Anne Frank')).toBe(false);
    });

    it('still forgives the usual misspellings', () => {
        expect(solves('Ghandi', 'Mahatma Gandhi')).toBe(true);
        expect(solves('Katherine the Great', 'Catherine the Great')).toBe(true);
        expect(solves('Michaelangelo', 'Michelangelo')).toBe(true);
        expect(solves('Nightengale', 'Florence Nightingale')).toBe(true);
    });
});

describe('isCloseMatch against the roster', () => {
    it('needs a distinctive name token, not just a title', () => {
        expect(solves('queen', 'Queen Elizabeth I')).toBe(false);
        expect(solves('elizabeth', 'Queen Elizabeth I')).toBe(true);
        expect(solves('Elizabeth I', 'Queen Elizabeth I')).toBe(true);
    });

    it('forgives a typo in a name', () => {
        expect(solves('Einstien', 'Albert Einstein')).toBe(true);
        expect(solves('Newton', 'Albert Einstein')).toBe(false);
    });

    it('does not let an epithet or a title solve a figure', () => {
        expect(solves('Great', 'Alexander the Great')).toBe(false);
        expect(solves('the great', 'Catherine the Great')).toBe(false);
        expect(solves('king', 'Martin Luther King Jr.')).toBe(false);
        expect(solves('magnificent', 'Suleiman the Magnificent')).toBe(false);
        expect(solves('alexander', 'Alexander the Great')).toBe(true);
        expect(solves('Catherine', 'Catherine the Great')).toBe(true);
        expect(solves('MLK', 'Martin Luther King Jr.')).toBe(true);
        expect(solves('Suleiman', 'Suleiman the Magnificent')).toBe(true);
    });

    it('accepts unaccented and native spellings listed as alternate names', () => {
        expect(solves('simon bolivar', 'Simón Bolívar')).toBe(true);
        expect(solves('ibn sina', 'Avicenna')).toBe(true);
        expect(solves('King Tut', 'Tutankhamun')).toBe(true);
    });
});

describe('isCorrectGuess with words around a name', () => {
    it("accepts titles, initials, ordinals and words of the figure's other names", () => {
        expect(solves('Sir Isaac Newton', 'Isaac Newton')).toBe(true);
        expect(solves('Sir Issac Newton', 'Isaac Newton')).toBe(true);
        expect(solves('Emperor Napoleon', 'Napoleon Bonaparte')).toBe(true);
        expect(solves('Napoleon I', 'Napoleon Bonaparte')).toBe(true);
        expect(solves('Napoleon the First', 'Napoleon Bonaparte')).toBe(true);
        expect(solves('Queen Elizabeth the First', 'Queen Elizabeth I')).toBe(true);
        expect(solves('Elizabeth the 1st', 'Queen Elizabeth I')).toBe(true);
        expect(solves('W. A. Mozart', 'Wolfgang Amadeus Mozart')).toBe(true);
        expect(solves('Dr. Martin Luther King Jr.', 'Martin Luther King Jr.')).toBe(true);
        expect(solves('Is it Einstein?', 'Albert Einstein')).toBe(true);
    });

    it('accepts a short name with a title or a word of its own around it', () => {
        expect(solves('MLK Jr', 'Martin Luther King Jr.')).toBe(true);
        expect(solves('MLK Jr.', 'Martin Luther King Jr.')).toBe(true);
        expect(solves('Pharaoh Tut', 'Tutankhamun')).toBe(true);
        expect(solves('Emperor Wu', 'Wu Zetian')).toBe(true);
    });

    it('does not let someone who shares a first name or a surname win', () => {
        expect(solves('Marie Antoinette', 'Marie Curie')).toBe(false);
        expect(solves('Pierre Curie', 'Marie Curie')).toBe(false);
        expect(solves('Louis Armstrong', 'Louis Pasteur')).toBe(false);
        expect(solves('Louis Armstrong', 'Neil Armstrong')).toBe(false);
        expect(solves('Joan Baez', 'Joan of Arc')).toBe(false);
        expect(solves('Alexander Hamilton', 'Alexander the Great')).toBe(false);
        expect(solves('Charles Dickens', 'Charles Darwin')).toBe(false);
        expect(solves('Indira Gandhi', 'Mahatma Gandhi')).toBe(false);
        expect(solves('Otto Frank', 'Anne Frank')).toBe(false);
        expect(solves('Augustus Caesar', 'Julius Caesar')).toBe(false);
    });

    it('does not let a different ordinal win, even as a near spelling', () => {
        expect(solves('Elizabeth II', 'Queen Elizabeth I')).toBe(false);
        expect(solves('Queen Elizabeth II', 'Queen Elizabeth I')).toBe(false);
        expect(solves('Elizabeth the Second', 'Queen Elizabeth I')).toBe(false);
        expect(solves('Alexander II', 'Alexander the Great')).toBe(false);
        expect(solves('Catherine I', 'Catherine the Great')).toBe(false);
        expect(solves('Charles I', 'Charles Darwin')).toBe(false);
        expect(solves('Napoleon III', 'Napoleon Bonaparte')).toBe(false);
        expect(solves('Martin Luther King Sr.', 'Martin Luther King Jr.')).toBe(false);
    });
});
