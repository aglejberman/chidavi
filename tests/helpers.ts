import { parseBank } from '../src/core/bank';
import { createGame } from '../src/core/game';
import type { GameState } from '../src/core/game';
import { buildGameWords } from '../src/core/list';
import type { WordCase } from '../src/core/types';
import bankData from '../src/data/bank.json';

export const bank: readonly WordCase[] = parseBank(bankData);

/** Banco pequeño y legible para tests de reglas. */
export const tinyBank: readonly WordCase[] = [
  { id: 1, word: 'deseo', syllables: ['de', 'se', 'o'], distractor: 'sol' },
  { id: 2, word: 'marino', syllables: ['ma', 'ri', 'no'], distractor: 'la' },
  { id: 3, word: 'planeta', syllables: ['pla', 'ne', 'ta'], distractor: 'fa' },
];

export function newGame(
  startedAt = 1_000,
  words = buildGameWords(7, tinyBank, 3),
): GameState {
  return createGame('TEST0', words, startedAt);
}
