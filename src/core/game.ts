import {
  SKIP_PENALTY_SECONDS,
  SLOT_COUNT,
  TILE_COUNT,
  errorPenaltySeconds,
  totalTimeMs,
} from './rules';
import type { GameWord } from './types';

export type WordOutcome = 'solved' | 'skipped';

export interface WordResult {
  readonly wordId: number;
  readonly word: string;
  readonly outcome: WordOutcome;
  /** Errores cometidos en esta palabra. */
  readonly errors: number;
  /** Penalización total de esta palabra (errores + salto). */
  readonly penaltySeconds: number;
}

/**
 * Fases de una partida:
 * - `playing`: el jugador arma la palabra.
 * - `wrong`: feedback transitorio de un error (las casillas se vacían al terminar).
 * - `correct`: feedback transitorio de un acierto.
 * - `revealed`: se muestra la respuesta tras saltar la palabra.
 * - `finished`: ya no quedan palabras.
 */
export type GamePhase = 'playing' | 'wrong' | 'correct' | 'revealed' | 'finished';

export interface GameState {
  readonly code: string;
  readonly words: readonly GameWord[];
  /** Índice de la palabra actual. */
  readonly index: number;
  /** Casillas: índice de la ficha que contiene, o `null` si está vacía. */
  readonly slots: readonly (number | null)[];
  /** Casilla seleccionada para moverla o quitarla. */
  readonly selectedSlot: number | null;
  /** Giro de las fichas disponibles (solo afecta a cómo se ven). */
  readonly rotation: number;
  readonly errorsInWord: number;
  readonly penaltyInWord: number;
  /** Penalización total acumulada en la partida. */
  readonly penaltySeconds: number;
  /** Penalización del último evento (error o salto), para mostrarla al jugador. */
  readonly lastPenaltySeconds: number | null;
  readonly skipArmed: boolean;
  readonly results: readonly WordResult[];
  readonly phase: GamePhase;
  readonly startedAt: number;
  readonly finishedAt: number | null;
}

export type GameAction =
  | { readonly type: 'pickTile'; readonly tile: number }
  | { readonly type: 'tapSlot'; readonly slot: number }
  | { readonly type: 'clearSlots' }
  | { readonly type: 'rotateTiles' }
  | { readonly type: 'check'; readonly now: number }
  | { readonly type: 'armSkip' }
  | { readonly type: 'disarmSkip' }
  | { readonly type: 'confirmSkip'; readonly now: number }
  /** Cierra el feedback transitorio (acierto, error o respuesta revelada). */
  | { readonly type: 'dismissFeedback' };

const EMPTY_SLOTS: readonly (number | null)[] = Array.from(
  { length: SLOT_COUNT },
  () => null,
);

export function createGame(
  code: string,
  words: readonly GameWord[],
  startedAt: number,
): GameState {
  if (words.length === 0)
    throw new RangeError('Una partida necesita al menos una palabra');
  return {
    code,
    words,
    index: 0,
    slots: EMPTY_SLOTS,
    selectedSlot: null,
    rotation: 0,
    errorsInWord: 0,
    penaltyInWord: 0,
    penaltySeconds: 0,
    lastPenaltySeconds: null,
    skipArmed: false,
    results: [],
    phase: 'playing',
    startedAt,
    finishedAt: null,
  };
}

// --- Selectores -------------------------------------------------------------------

export function currentWord(state: GameState): GameWord {
  const word = state.words[Math.min(state.index, state.words.length - 1)];
  if (!word) throw new Error('Partida sin palabras');
  return word;
}

/** Índices de fichas en el orden en que se muestran (aplica el giro). */
export function tileDisplayOrder(state: GameState): number[] {
  return Array.from(
    { length: TILE_COUNT },
    (_, position) => (position + state.rotation) % TILE_COUNT,
  );
}

export function areSlotsFull(state: GameState): boolean {
  return !state.slots.includes(null);
}

export function elapsedMs(state: GameState, now: number): number {
  return Math.max(0, (state.finishedAt ?? now) - state.startedAt);
}

/** Tiempo mostrado al jugador: tiempo real más penalizaciones. */
export function totalMs(state: GameState, now: number): number {
  return totalTimeMs(elapsedMs(state, now), state.penaltySeconds);
}

export interface GameSummary {
  readonly solved: number;
  readonly skipped: number;
  readonly errors: number;
  readonly penaltySeconds: number;
}

export function summarize(state: GameState): GameSummary {
  return {
    solved: state.results.filter((r) => r.outcome === 'solved').length,
    skipped: state.results.filter((r) => r.outcome === 'skipped').length,
    errors: state.results.reduce((sum, r) => sum + r.errors, 0),
    penaltySeconds: state.penaltySeconds,
  };
}

// --- Reductor ---------------------------------------------------------------------

function guessedWord(state: GameState): string {
  const word = currentWord(state);
  return state.slots
    .map((tile) => (tile === null ? '' : (word.tiles[tile] ?? '')))
    .join('');
}

function withSlot(
  slots: readonly (number | null)[],
  slot: number,
  value: number | null,
): (number | null)[] {
  const next = [...slots];
  next[slot] = value;
  return next;
}

function recordResult(state: GameState, outcome: WordOutcome, now: number): GameState {
  const word = currentWord(state);
  const results = [
    ...state.results,
    {
      wordId: word.id,
      word: word.word,
      outcome,
      errors: state.errorsInWord,
      penaltySeconds: state.penaltyInWord,
    },
  ];
  const isLast = state.index >= state.words.length - 1;
  return { ...state, results, finishedAt: isLast ? now : null };
}

function pickTile(state: GameState, tile: number): GameState {
  if (state.phase !== 'playing') return state;
  if (tile < 0 || tile >= TILE_COUNT || state.slots.includes(tile)) return state;
  const slot = state.slots.indexOf(null);
  if (slot === -1) return state;
  return {
    ...state,
    slots: withSlot(state.slots, slot, tile),
    selectedSlot: null,
    skipArmed: false,
  };
}

function tapSlot(state: GameState, slot: number): GameState {
  if (state.phase !== 'playing' || slot < 0 || slot >= SLOT_COUNT) return state;
  const content = state.slots[slot] ?? null;
  const selected = state.selectedSlot;

  if (content === null) {
    // Casilla vacía: mueve allí la sílaba seleccionada, si la hay.
    if (selected === null) return state;
    const moved = withSlot(
      withSlot(state.slots, slot, state.slots[selected] ?? null),
      selected,
      null,
    );
    return { ...state, slots: moved, selectedSlot: null };
  }
  if (selected === null) return { ...state, selectedSlot: slot };
  if (selected === slot) {
    // Tocar dos veces la misma casilla devuelve la sílaba a las disponibles.
    return { ...state, slots: withSlot(state.slots, slot, null), selectedSlot: null };
  }
  const swapped = withSlot(
    withSlot(state.slots, slot, state.slots[selected] ?? null),
    selected,
    content,
  );
  return { ...state, slots: swapped, selectedSlot: null };
}

function check(state: GameState, now: number): GameState {
  if (state.phase !== 'playing' || !areSlotsFull(state)) return state;

  if (guessedWord(state) === currentWord(state).word) {
    return {
      ...recordResult(state, 'solved', now),
      phase: 'correct',
      selectedSlot: null,
    };
  }
  const errorsInWord = state.errorsInWord + 1;
  const penalty = errorPenaltySeconds(errorsInWord);
  return {
    ...state,
    phase: 'wrong',
    errorsInWord,
    penaltyInWord: state.penaltyInWord + penalty,
    penaltySeconds: state.penaltySeconds + penalty,
    lastPenaltySeconds: penalty,
    selectedSlot: null,
  };
}

function confirmSkip(state: GameState, now: number): GameState {
  if (state.phase !== 'playing' || !state.skipArmed) return state;
  const charged: GameState = {
    ...state,
    penaltyInWord: state.penaltyInWord + SKIP_PENALTY_SECONDS,
    penaltySeconds: state.penaltySeconds + SKIP_PENALTY_SECONDS,
    lastPenaltySeconds: SKIP_PENALTY_SECONDS,
  };
  return {
    ...recordResult(charged, 'skipped', now),
    phase: 'revealed',
    // Se muestra la respuesta en las casillas.
    slots: [...currentWord(state).solution],
    selectedSlot: null,
    skipArmed: false,
  };
}

function dismissFeedback(state: GameState): GameState {
  switch (state.phase) {
    case 'wrong':
      return { ...state, phase: 'playing', slots: EMPTY_SLOTS };
    case 'correct':
    case 'revealed': {
      if (state.index >= state.words.length - 1) return { ...state, phase: 'finished' };
      return {
        ...state,
        phase: 'playing',
        index: state.index + 1,
        slots: EMPTY_SLOTS,
        selectedSlot: null,
        rotation: 0,
        errorsInWord: 0,
        penaltyInWord: 0,
        lastPenaltySeconds: null,
        skipArmed: false,
      };
    }
    default:
      return state;
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'pickTile':
      return pickTile(state, action.tile);
    case 'tapSlot':
      return tapSlot(state, action.slot);
    case 'clearSlots':
      return state.phase === 'playing'
        ? { ...state, slots: EMPTY_SLOTS, selectedSlot: null }
        : state;
    case 'rotateTiles':
      return state.phase === 'playing'
        ? { ...state, rotation: (state.rotation + 1) % TILE_COUNT }
        : state;
    case 'check':
      return check(state, action.now);
    case 'armSkip':
      return state.phase === 'playing' ? { ...state, skipArmed: true } : state;
    case 'disarmSkip':
      return state.skipArmed ? { ...state, skipArmed: false } : state;
    case 'confirmSkip':
      return confirmSkip(state, action.now);
    case 'dismissFeedback':
      return dismissFeedback(state);
  }
}
