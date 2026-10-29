import { describe, expect, it } from 'vitest';
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateCode,
  normalizeCode,
  parseCode,
} from '../src/core/code';
import { createRng } from '../src/core/random';

describe('generateCode', () => {
  it('genera códigos de 5 símbolos del alfabeto permitido', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const code = generateCode(1, rng);
      expect(code).toHaveLength(CODE_LENGTH);
      expect(Array.from(code).every((char) => CODE_ALPHABET.includes(char))).toBe(true);
    }
  });

  it('todo código generado es válido para su versión', () => {
    const rng = createRng(2);
    for (let i = 0; i < 200; i++) {
      expect(parseCode(generateCode(1, rng), 1).ok).toBe(true);
    }
  });
});

describe('parseCode', () => {
  it('devuelve la misma semilla para el mismo código', () => {
    const code = generateCode(1, createRng(3));
    const a = parseCode(code, 1);
    const b = parseCode(code.toLowerCase(), 1);
    expect(a.ok && b.ok && a.seed === b.seed).toBe(true);
  });

  it('acepta minúsculas, espacios y guiones', () => {
    const code = generateCode(1, createRng(4));
    const spaced = `${code.slice(0, 2)} - ${code.slice(2)}`.toLowerCase();
    const parsed = parseCode(spaced, 1);
    expect(parsed.ok && parsed.code).toBe(code);
  });

  it('rechaza longitudes incorrectas', () => {
    expect(parseCode('ABC', 1)).toEqual({ ok: false, reason: 'length' });
    expect(parseCode('ABCDEFG', 1)).toEqual({ ok: false, reason: 'length' });
  });

  it('rechaza caracteres que no pertenecen al alfabeto', () => {
    expect(parseCode('AB#DE', 1)).toEqual({ ok: false, reason: 'length' });
    expect(parseCode('ABUDE', 1)).toEqual({ ok: false, reason: 'characters' });
  });

  it('detecta cualquier error de tipeo de un símbolo', () => {
    const code = generateCode(1, createRng(5));
    for (let position = 0; position < CODE_LENGTH; position++) {
      for (const char of CODE_ALPHABET) {
        if (char === code.charAt(position)) continue;
        const typo = code.slice(0, position) + char + code.slice(position + 1);
        expect(parseCode(typo, 1).ok).toBe(false);
      }
    }
  });

  it('rechaza un código generado con otra versión del banco', () => {
    const rng = createRng(6);
    for (let i = 0; i < 50; i++) {
      const code = generateCode(1, rng);
      expect(parseCode(code, 2)).toEqual({ ok: false, reason: 'checksum' });
    }
  });
});

describe('normalizeCode', () => {
  it('aplica las sustituciones de Crockford', () => {
    expect(normalizeCode('o1il')).toBe('0111');
  });
});
