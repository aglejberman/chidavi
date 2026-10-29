/** Una entrada del banco: tres sílabas que forman la palabra más una distractora. */
export interface WordCase {
  readonly id: number;
  readonly word: string;
  readonly syllables: readonly [string, string, string];
  readonly distractor: string;
}

/** Una palabra tal como se juega: cuatro fichas en el orden en que se muestran. */
export interface GameWord {
  readonly id: number;
  readonly word: string;
  /** Sílabas mostradas en pantalla (3 válidas + 1 distractora, mezcladas). */
  readonly tiles: readonly string[];
  /** Índices de `tiles` que forman la palabra, en orden. */
  readonly solution: readonly [number, number, number];
}
