import { describe, expect, it } from 'vitest';
import type { HistoricFigure } from '../types';
import { allFigures, figureId, getEnabledFigures, getFigureById, getFigureCount } from './figuresConfig';
import { DAILY_EPOCH, getFigureNameTokens, isCloseMatch, selectDailyFigure, shiftDateKey } from '../utils/gameUtils';

/**
 * The first daily cycle as it shipped, one name per day from 2026-11-04.
 * People have played or will play these days, so only a rename may change this list.
 */
const FIRST_DAILY_CYCLE = [
    "Wangari Maathai",
    "Jane Austen",
    "Abraham Lincoln",
    "Ada Lovelace",
    "Mahatma Gandhi",
    "Boudica",
    "Confucius",
    "Isaac Newton",
    "Alan Turing",
    "Tutankhamun",
    "Montezuma II",
    "Hatshepsut",
    "Avicenna",
    "Hokusai",
    "Murasaki Shikibu",
    "George Washington",
    "Albert Einstein",
    "Queen Elizabeth I",
    "Nikola Tesla",
    "Leonardo da Vinci",
    "Pablo Picasso",
    "Michelangelo",
    "Wu Zetian",
    "Mansa Musa",
    "Alexander the Great",
    "Agatha Christie",
    "Ludwig van Beethoven",
    "Catherine the Great",
    "Rosa Parks",
    "Ibn Battuta",
    "Cleopatra",
    "Yuri Gagarin",
    "Queen Victoria",
    "Florence Nightingale",
    "Johannes Gutenberg",
    "Harriet Tubman",
    "William Shakespeare",
    "Neil Armstrong",
    "Socrates",
    "Julius Caesar",
    "Louis Pasteur",
    "Anne Frank",
    "Wolfgang Amadeus Mozart",
    "Joan of Arc",
    "Galileo Galilei",
    "Winston Churchill",
    "Marco Polo",
    "Marie Curie",
    "Simón Bolívar",
    "Zheng He",
    "Frida Kahlo",
    "Vincent van Gogh",
    "Napoleon Bonaparte",
    "Nelson Mandela",
    "Helen Keller",
    "Martin Luther King Jr.",
    "Suleiman the Magnificent",
    "Charles Darwin",
    "Amelia Earhart",
    "Archimedes",
];

/**
 * Mirrors the Classic-mode check in useGame: a guess wins when it matches the
 * figure's name or any of its alternate names.
 */
function winsRound(guess: string, figure: HistoricFigure): boolean {
    return [figure.name, ...figure.alternateNames].some(answer => isCloseMatch(guess, answer));
}

/** What a player could copy from an era tag into the guess box: the whole tag, or any one word. */
function guessesFromTag(tag: string): string[] {
    return [tag, ...tag.split(/[^\p{L}\p{N}']+/u).filter(Boolean)];
}

describe('figuresConfig', () => {
    it('derives stable, URL-safe ids from names', () => {
        expect(figureId('Albert Einstein')).toBe('albert-einstein');
        expect(figureId("Jeanne d'Arc")).toBe('jeanne-d-arc');
        expect(figureId('Queen Elizabeth I')).toBe('queen-elizabeth-i');
    });

    it('gives every figure a unique id and exactly five clues', () => {
        const ids = allFigures.map(figure => figureId(figure.name));
        expect(new Set(ids).size).toBe(ids.length);
        for (const figure of allFigures) {
            expect(figure.clues).toHaveLength(5);
            expect(figure.alternateNames.length).toBeGreaterThan(0);
        }
    });

    it('looks up enabled figures by id without the enabled flag', () => {
        const einstein = getFigureById('albert-einstein');
        expect(einstein?.name).toBe('Albert Einstein');
        expect(einstein).not.toHaveProperty('enabled');
        expect(getFigureById('nobody')).toBeUndefined();
    });

    it('enables the whole roster', () => {
        expect(getEnabledFigures()).toHaveLength(allFigures.length);
    });

    it('has at least 50 enabled figures so the daily puzzle does not repeat for weeks', () => {
        expect(getFigureCount().enabled).toBeGreaterThanOrEqual(50);
    });

    it('gives every figure at least one easy clue for the adaptive hint', () => {
        for (const figure of allFigures) {
            expect(figure.clues.some(clue => clue.difficulty === 'easy'), figure.name).toBe(true);
        }
    });

    it('never mentions the name or an alternate name in a clue', () => {
        for (const figure of allFigures) {
            const names = [figure.name, ...figure.alternateNames].map(name => name.toLowerCase());
            for (const clue of figure.clues) {
                const text = clue.text.toLowerCase();
                for (const name of names) {
                    expect(text.includes(name), `${figure.name}: "${clue.text}" contains "${name}"`).toBe(false);
                }
            }
        }
    });

    it('never shows an era tag that would win the round if typed as a guess', () => {
        // Era tags sit under the silhouette from the first second, before any clue.
        for (const figure of allFigures) {
            for (const tag of figure.eraTags ?? []) {
                for (const guess of guessesFromTag(tag)) {
                    expect(winsRound(guess, figure), `${figure.name}: typing "${guess}" from the era tag "${tag}" wins`).toBe(false);
                }
            }
        }
    });

    it('counts a tag built from the name as a winning guess', () => {
        // Tags that gave the answer away, so the check above cannot quietly go blind.
        const giveaways: [name: string, tag: string][] = [
            ['Napoleon Bonaparte', 'Napoleonic Era'],
            ['Queen Elizabeth I', 'Elizabethan'],
            ['Queen Elizabeth I', 'Tudor England'], // "elizabeth tudor" is an accepted answer
        ];
        for (const [name, tag] of giveaways) {
            const figure = allFigures.find(candidate => candidate.name === name);
            expect(figure && guessesFromTag(tag).some(guess => winsRound(guess, figure)), `${name}: "${tag}"`).toBe(true);
        }
    });

    it('keeps alternate names lower-case and distinct', () => {
        for (const figure of allFigures) {
            for (const name of figure.alternateNames) {
                expect(name, figure.name).toBe(name.toLowerCase());
            }
            expect(new Set(figure.alternateNames).size, figure.name).toBe(figure.alternateNames.length);
        }
    });

    it('gives every figure a voice line and era tags', () => {
        for (const figure of allFigures) {
            expect(figure.voiceLine?.trim(), figure.name).toBeTruthy();
            expect(figure.eraTags?.length, figure.name).toBeGreaterThan(0);
            for (const tag of figure.eraTags ?? []) {
                expect(tag.trim(), figure.name).toBeTruthy();
            }
        }
    });
});

describe('getFigureNameTokens', () => {
    it('keeps distinctive name parts and drops titles and short words', () => {
        const tokens = getFigureNameTokens(getEnabledFigures());
        expect(tokens).toEqual(expect.arrayContaining(['einstein', 'curie', 'elizabeth', 'napoleon', 'joan']));
        expect(tokens).not.toContain('queen');
        expect(tokens).not.toContain('of');
        expect(tokens).not.toContain('da');
    });

    it('drops epithets so "were you great?" still reads as a question', () => {
        const tokens = getFigureNameTokens(getEnabledFigures());
        for (const epithet of ['great', 'magnificent', 'conqueror', 'jr', 'king']) {
            expect(tokens).not.toContain(epithet);
        }
    });
});

describe('daily schedule', () => {
    it('keeps the first cycle exactly as it shipped', () => {
        const disabled = new Set(allFigures.filter(figure => !figure.enabled).map(figure => figure.name));
        FIRST_DAILY_CYCLE.forEach((name, day) => {
            const dateKey = shiftDateKey(DAILY_EPOCH, day);
            const scheduled = selectDailyFigure(dateKey, allFigures)?.name;
            // A figure pulled from the game has a stand-in on its days; everyone else stays put.
            if (!disabled.has(name)) expect(scheduled, dateKey).toBe(name);
        });
    });

    it('keeps the launch date for the figures that launched', () => {
        const launched = allFigures.filter(figure => figure.dailyFrom === DAILY_EPOCH);
        expect(launched).toHaveLength(FIRST_DAILY_CYCLE.length);
    });

    it('gives every figure a real calendar date on or after the launch', () => {
        for (const figure of allFigures) {
            expect(figure.dailyFrom, figure.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(shiftDateKey(figure.dailyFrom, 0), figure.name).toBe(figure.dailyFrom);
            expect(figure.dailyFrom >= DAILY_EPOCH, figure.name).toBe(true);
        }
    });
});
