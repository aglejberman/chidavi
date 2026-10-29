import { describe, expect, it } from 'vitest';
import { shuffle, createRng } from '../src/core/random';
import { buildGameWords } from '../src/core/list';
import { WORDS_PER_GAME } from '../src/core/rules';
import { bank, tinyBank } from './helpers';

describe('shuffle', () => {
  it('conserva los elementos y no modifica el original', () => {
    const original = [1, 2, 3, 4, 5, 6];
    const result = shuffle(original, createRng(1));
    expect([...result].sort()).toEqual(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('buildGameWords', () => {
  it('es determinista: misma semilla, misma lista', () => {
    expect(buildGameWords(12345, bank)).toEqual(buildGameWords(12345, bank));
  });

  it('semillas distintas dan listas distintas', () => {
    const a = buildGameWords(1, bank).map((w) => w.id);
    const b = buildGameWords(2, bank).map((w) => w.id);
    expect(a).not.toEqual(b);
  });

  it('elige 10 palabras distintas', () => {
    const words = buildGameWords(99, bank);
    expect(words).toHaveLength(WORDS_PER_GAME);
    expect(new Set(words.map((w) => w.id)).size).toBe(WORDS_PER_GAME);
  });

  it('cada palabra tiene 4 fichas y la solución forma la palabra', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const word of buildGameWords(seed, bank)) {
        expect(word.tiles).toHaveLength(4);
        const formed = word.solution.map((tile) => word.tiles[tile]).join('');
        expect(formed).toBe(word.word);
        expect(new Set(word.solution).size).toBe(3);
      }
    }
  });

  it('falla si el banco no alcanza', () => {
    expect(() => buildGameWords(1, tinyBank)).toThrow(RangeError);
  });
});
