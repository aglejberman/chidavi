import type { Rng } from './random';

/**
 * Código de lista: 5 símbolos.
 *
 * - Los 4 primeros forman la semilla (20 bits) que determina las palabras de la partida.
 * - El 5.º es un símbolo de control que depende de la semilla y de la versión del banco.
 *   Detecta errores de tipeo y códigos generados con otra versión del banco de palabras
 *   (con otro banco, el mismo código daría otras palabras).
 *
 * Alfabeto Crockford base32: sin I, L, O ni U para evitar confusiones al dictarlo.
 */
export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 5;
const PAYLOAD_LENGTH = CODE_LENGTH - 1;
/** Pesos impares: son invertibles módulo 32, así que cualquier error de un símbolo se detecta. */
const WEIGHTS = [1, 3, 5, 7] as const;
const VERSION_WEIGHT = 11;
const BASE = CODE_ALPHABET.length;

export type CodeError = 'length' | 'characters' | 'checksum';

export type ParsedCode =
  | { readonly ok: true; readonly code: string; readonly seed: number }
  | { readonly ok: false; readonly reason: CodeError };

function checkSymbol(payload: readonly number[], version: number): number {
  const weighted = payload.reduce((sum, value, i) => sum + value * (WEIGHTS[i] ?? 1), 0);
  return (weighted + version * VERSION_WEIGHT) % BASE;
}

function seedFromPayload(payload: readonly number[]): number {
  return payload.reduce((seed, value) => seed * BASE + value, 0);
}

function symbolsToCode(payload: readonly number[], version: number): string {
  return [...payload, checkSymbol(payload, version)]
    .map((value) => CODE_ALPHABET.charAt(value))
    .join('');
}

/** Genera un código nuevo para la versión de banco indicada. */
export function generateCode(version: number, rng: Rng = Math.random): string {
  const payload = Array.from({ length: PAYLOAD_LENGTH }, () => Math.floor(rng() * BASE));
  return symbolsToCode(payload, version);
}

/**
 * Normaliza lo que escribe el jugador: mayúsculas, sin espacios ni guiones y con las
 * sustituciones habituales de Crockford (O→0, I/L→1).
 */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** Valida un código y extrae su semilla. */
export function parseCode(input: string, version: number): ParsedCode {
  const code = normalizeCode(input);
  if (code.length !== CODE_LENGTH) return { ok: false, reason: 'length' };

  const symbols = Array.from(code, (char) => CODE_ALPHABET.indexOf(char));
  if (symbols.includes(-1)) return { ok: false, reason: 'characters' };

  const payload = symbols.slice(0, PAYLOAD_LENGTH);
  if (symbols[PAYLOAD_LENGTH] !== checkSymbol(payload, version)) {
    return { ok: false, reason: 'checksum' };
  }
  return { ok: true, code, seed: seedFromPayload(payload) };
}
