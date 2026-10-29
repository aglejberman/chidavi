/** Palabras que componen una partida. */
export const WORDS_PER_GAME = 10;
/** Casillas donde el jugador arma la palabra. */
export const SLOT_COUNT = 3;
/** Fichas (sílabas) disponibles por palabra: 3 válidas + 1 distractora. */
export const TILE_COUNT = 4;

/**
 * Penalización, en segundos, por el 1.º, 2.º y 3.º error en una misma palabra.
 * A partir del 4.º error ya no se penaliza.
 */
export const ERROR_PENALTIES_SECONDS: readonly number[] = [5, 10, 20];

/** Penalización, en segundos, por saltar una palabra. */
export const SKIP_PENALTY_SECONDS = 35;

/**
 * Penalización por el error número `errorNumber` (base 1) dentro de una palabra.
 * El contador se reinicia en cada palabra.
 */
export function errorPenaltySeconds(errorNumber: number): number {
  if (!Number.isInteger(errorNumber) || errorNumber < 1) {
    throw new RangeError(
      `errorNumber debe ser un entero >= 1 (recibido: ${errorNumber})`,
    );
  }
  return ERROR_PENALTIES_SECONDS[errorNumber - 1] ?? 0;
}

/** Tiempo final: tiempo real de juego más las penalizaciones acumuladas. */
export function totalTimeMs(elapsedMs: number, penaltySeconds: number): number {
  return Math.max(0, elapsedMs) + penaltySeconds * 1000;
}
