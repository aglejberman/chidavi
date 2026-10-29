import { describe, expect, it } from 'vitest';
import { BankValidationError, parseBank } from '../src/core/bank';
import bankData from '../src/data/bank.json';

describe('banco de palabras (src/data/bank.json)', () => {
  it('es válido y tiene suficientes palabras para jugar', () => {
    const bank = parseBank(bankData);
    expect(bank.length).toBeGreaterThanOrEqual(10);
  });

  it('no repite palabras ni ids', () => {
    const bank = parseBank(bankData);
    expect(new Set(bank.map((c) => c.word)).size).toBe(bank.length);
    expect(new Set(bank.map((c) => c.id)).size).toBe(bank.length);
  });
});

describe('parseBank', () => {
  const valid = { id: 1, word: 'deseo', syllables: ['de', 'se', 'o'], distractor: 'sol' };

  it('acepta una entrada válida', () => {
    expect(parseBank([valid])).toHaveLength(1);
  });

  it('rechaza lo que no es una lista', () => {
    expect(() => parseBank({})).toThrow(BankValidationError);
  });

  it('rechaza sílabas que no forman la palabra', () => {
    expect(() => parseBank([{ ...valid, word: 'deseos' }])).toThrow(
      /no forman la palabra/,
    );
  });

  it('rechaza un distractor repetido', () => {
    expect(() => parseBank([{ ...valid, distractor: 'se' }])).toThrow(/distractor/);
  });

  it('rechaza ids y palabras duplicados', () => {
    expect(() => parseBank([valid, valid])).toThrow(/duplicad/);
  });

  it('rechaza entradas con menos de 3 sílabas', () => {
    expect(() => parseBank([{ ...valid, syllables: ['de', 'seo'] }])).toThrow(
      /3 sílabas/,
    );
  });
});
