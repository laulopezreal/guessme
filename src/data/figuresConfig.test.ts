import { describe, expect, it } from 'vitest';
import { allFigures, figureId, getEnabledFigures, getFigureById, getFigureCount } from './figuresConfig';
import { getFigureNameTokens } from '../utils/gameUtils';

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
