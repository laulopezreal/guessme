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

/**
 * What a player could copy from a clue into the guess box: any one word as
 * written ("nation's", "one-dollar"), or any part of one between apostrophes
 * and hyphens ("nation", "dollar"). Surrounding punctuation is dropped.
 */
function guessesFromClue(text: string): string[] {
    const asWritten = text.split(/\s+/).map(word => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''));
    const parts = text.split(/[^\p{L}\p{N}]+/u);
    return [...new Set([...asWritten, ...parts])].filter(Boolean);
}

/**
 * Clue words that win the round only because the matcher is lenient, not
 * because the clue names the figure: ordinary words ("During" for Alan Turing)
 * and fair hints ("Syracuse" for Archimedes). Whether the matcher should keep
 * accepting them is a separate decision, so the clues keep them. Delete an
 * entry once its word stops winning; a test below fails until you do.
 */
const LENIENT_MATCH_CLUE_WORDS: [name: string, word: string][] = [
    // Near spellings: the fuzzy match allows two edits in an answer of 5-9 characters and three in a longer one.
    ['Charles Darwin', 'shares'], // two edits from "charles"
    ['Alan Turing', 'During'], // one edit from "turing"
    ['Wu Zetian', 'empress'], // three characters short of "empress wu": the fuzzy match lets in a title the partial match blocks
    // Fragments: any piece of an answer that is four or more letters long and
    // not on the stopword list wins, so part of a name, or a place, title or
    // epithet in a longer alternate name, wins on its own.
    ['Florence Nightingale', 'night'], // inside "nightingale"
    ['Florence Nightingale', 'lamp'], // inside "the lady with the lamp"
    ['Hatshepsut', 'pharaoh'], // inside "pharaoh hatshepsut"
    ['Zheng He', 'admiral'], // inside "admiral zheng he"
    ['Suleiman the Magnificent', 'sultan'], // inside "sultan suleiman"
    ['Suleiman the Magnificent', 'Lawgiver'], // inside "suleiman the lawgiver"
    ['Mansa Musa', 'Mali'], // inside "musa i of mali"
    ['Alexander the Great', 'Macedon'], // inside "alexander of macedon"
    ['Catherine the Great', 'Russia'], // inside "catherine ii of russia"
    ['Archimedes', 'Syracuse'], // inside "archimedes of syracuse"
];

function isLenientMatchClueWord(figure: HistoricFigure, guess: string): boolean {
    return LENIENT_MATCH_CLUE_WORDS.some(([name, word]) => name === figure.name && word.toLowerCase() === guess.toLowerCase());
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

    it('never puts a word in a clue that would win the round if typed as a guess', () => {
        // Every revealed clue stays on screen while the player guesses.
        const winning: string[] = [];
        for (const figure of allFigures) {
            for (const clue of figure.clues) {
                for (const guess of guessesFromClue(clue.text)) {
                    if (winsRound(guess, figure) && !isLenientMatchClueWord(figure, guess)) {
                        winning.push(`${figure.name}: typing "${guess}" from "${clue.text}" wins`);
                    }
                }
            }
        }
        expect(winning).toEqual([]);
    });

    it('counts a clue word built from the name as a winning guess', () => {
        // Clues that gave the answer away, so the check above cannot quietly go blind.
        const giveaways: [name: string, clue: string][] = [
            ['Galileo Galilei', 'I discovered four moons of Jupiter, now called the Galilean moons.'], // "galilean" is two edits from "galileo"
            ['Simón Bolívar', 'I led the independence struggle that freed Venezuela, Colombia, Ecuador, Peru and Bolivia from Spain.'], // "bolivia" is two edits from "bolivar"
        ];
        for (const [name, clue] of giveaways) {
            const figure = allFigures.find(candidate => candidate.name === name);
            expect(figure && guessesFromClue(clue).some(guess => winsRound(guess, figure)), `${name}: "${clue}"`).toBe(true);
        }
    });

    it('exempts only clue words that are still in a clue and still win', () => {
        // Keeps the exemption list a true record of what the matcher still lets through.
        for (const [name, word] of LENIENT_MATCH_CLUE_WORDS) {
            const figure = allFigures.find(candidate => candidate.name === name);
            const inClue = figure?.clues.some(clue => guessesFromClue(clue.text).some(guess => guess.toLowerCase() === word.toLowerCase()));
            expect(inClue && figure && winsRound(word, figure), `${name}: "${word}" no longer wins or left the clues, so drop its exemption`).toBe(true);
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
