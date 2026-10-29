import { createRng, shuffle } from './random';
import { WORDS_PER_GAME } from './rules';
import type { GameWord, WordCase } from './types';

interface TileDraft {
  readonly text: string;
  /** Posición dentro de la palabra (0..2) o -1 si es la distractora. */
  readonly position: number;
}

/**
 * Construye la lista de palabras de una partida a partir de una semilla.
 *
 * Es una función pura y determinista: la misma semilla y el mismo banco producen
 * siempre las mismas palabras, en el mismo orden y con las sílabas en la misma
 * disposición, en cualquier dispositivo.
 */
export function buildGameWords(
  seed: number,
  bank: readonly WordCase[],
  count: number = WORDS_PER_GAME,
): GameWord[] {
  if (bank.length < count) {
    throw new RangeError(`El banco tiene ${bank.length} palabras y se piden ${count}`);
  }
  const rng = createRng(seed);
  return shuffle(bank, rng)
    .slice(0, count)
    .map((entry) => {
      const drafts: TileDraft[] = [
        ...entry.syllables.map((text, position) => ({ text, position })),
        { text: entry.distractor, position: -1 },
      ];
      const tiles = shuffle(drafts, rng);
      const indexOf = (position: number): number =>
        tiles.findIndex((tile) => tile.position === position);
      return {
        id: entry.id,
        word: entry.word,
        tiles: tiles.map((tile) => tile.text),
        solution: [indexOf(0), indexOf(1), indexOf(2)] as const,
      };
    });
}
