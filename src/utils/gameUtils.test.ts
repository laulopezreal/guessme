import { describe, expect, it } from 'vitest';
import { allFigures } from '../data/figuresConfig';
import { isCloseMatch } from './gameUtils';

/**
 * Mirrors the Classic-mode check in useGame: a guess wins when it matches the
 * figure's name or any of its alternate names.
 */
function solves(guess: string, figureName: string): boolean {
    const figure = allFigures.find(candidate => candidate.name === figureName);
    if (!figure) throw new Error(`No figure named ${figureName}`);
    return [figure.name, ...figure.alternateNames].some(answer => isCloseMatch(guess, answer));
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

    it('accepts a guess that contains the whole answer', () => {
        expect(isCloseMatch('Albert Einstein', 'einstein')).toBe(true);
        expect(isCloseMatch('queen elizabeth the first', 'elizabeth')).toBe(true);
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
});
