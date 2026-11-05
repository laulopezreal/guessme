import { describe, expect, it } from 'vitest';
import { allFigures, figureId, getEnabledFigures, getFigureById } from './figuresConfig';
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
