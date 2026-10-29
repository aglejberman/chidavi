import { describe, expect, it } from 'vitest';
import {
  areSlotsFull,
  currentWord,
  elapsedMs,
  gameReducer,
  summarize,
  tileDisplayOrder,
  totalMs,
} from '../src/core/game';
import type { GameAction, GameState } from '../src/core/game';
import { SKIP_PENALTY_SECONDS } from '../src/core/rules';
import { newGame } from './helpers';

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

/** Acciones para colocar las fichas indicadas, en orden, en las casillas. */
const pick = (...tiles: number[]): GameAction[] =>
  tiles.map((tile) => ({ type: 'pickTile', tile }));

/** Índices de las fichas que forman la palabra actual. */
function solutionOf(state: GameState): number[] {
  return [...currentWord(state).solution];
}

function solve(state: GameState, now = 5_000): GameState {
  return run(state, ...pick(...solutionOf(state)), { type: 'check', now });
}

describe('colocar sílabas', () => {
  it('llena las casillas de izquierda a derecha y no repite fichas', () => {
    const state = run(newGame(), ...pick(2, 2, 0));
    expect(state.slots).toEqual([2, 0, null]);
  });

  it('no permite colocar más de 3 fichas', () => {
    const state = run(newGame(), ...pick(0, 1, 2, 3));
    expect(state.slots).toEqual([0, 1, 2]);
    expect(areSlotsFull(state)).toBe(true);
  });

  it('borrar vacía todas las casillas', () => {
    const state = run(newGame(), ...pick(0, 1), { type: 'clearSlots' });
    expect(state.slots).toEqual([null, null, null]);
  });
});

describe('reacomodar casillas', () => {
  const filled = () => run(newGame(), ...pick(0, 1, 2));

  it('seleccionar y tocar otra casilla ocupada las intercambia', () => {
    const state = run(
      filled(),
      { type: 'tapSlot', slot: 0 },
      { type: 'tapSlot', slot: 2 },
    );
    expect(state.slots).toEqual([2, 1, 0]);
    expect(state.selectedSlot).toBeNull();
  });

  it('seleccionar y tocar una casilla vacía mueve la sílaba', () => {
    const state = run(
      newGame(),
      ...pick(0, 1),
      { type: 'tapSlot', slot: 0 },
      { type: 'tapSlot', slot: 2 },
    );
    expect(state.slots).toEqual([null, 1, 0]);
  });

  it('tocar dos veces la misma casilla devuelve la sílaba a las disponibles', () => {
    const state = run(
      filled(),
      { type: 'tapSlot', slot: 1 },
      { type: 'tapSlot', slot: 1 },
    );
    expect(state.slots).toEqual([0, null, 2]);
  });

  it('tocar una casilla vacía sin selección no hace nada', () => {
    const base = run(newGame(), ...pick(0));
    expect(gameReducer(base, { type: 'tapSlot', slot: 2 })).toBe(base);
  });
});

describe('rotar sílabas', () => {
  it('gira la disposición de las fichas disponibles', () => {
    const state = newGame();
    expect(tileDisplayOrder(state)).toEqual([0, 1, 2, 3]);
    expect(tileDisplayOrder(run(state, { type: 'rotateTiles' }))).toEqual([1, 2, 3, 0]);
  });

  it('da la vuelta completa tras 4 giros', () => {
    const state = run(
      newGame(),
      ...Array.from({ length: 4 }, (): GameAction => ({ type: 'rotateTiles' })),
    );
    expect(tileDisplayOrder(state)).toEqual([0, 1, 2, 3]);
  });

  it('no cambia el contenido de las casillas', () => {
    const state = run(newGame(), ...pick(0, 1), { type: 'rotateTiles' });
    expect(state.slots).toEqual([0, 1, null]);
  });
});

describe('comprobar', () => {
  it('no comprueba con casillas incompletas', () => {
    const base = run(newGame(), ...pick(0, 1));
    expect(gameReducer(base, { type: 'check', now: 2_000 })).toBe(base);
  });

  it('un acierto registra la palabra como resuelta sin penalización', () => {
    const state = solve(newGame());
    expect(state.phase).toBe('correct');
    expect(state.results).toHaveLength(1);
    expect(state.results[0]).toMatchObject({
      outcome: 'solved',
      errors: 0,
      penaltySeconds: 0,
    });
  });

  it('los errores penalizan 5, 10 y 20 segundos y luego dejan de penalizar', () => {
    let state = newGame();
    const expected = [5, 10, 20, 0, 0];
    expected.forEach((penalty, i) => {
      const before = state.penaltySeconds;
      state = gameReducer(fillWrong(state), { type: 'check', now: 2_000 + i });
      expect(state.phase).toBe('wrong');
      expect(state.lastPenaltySeconds).toBe(penalty);
      expect(state.penaltySeconds - before).toBe(penalty);
      state = gameReducer(state, { type: 'dismissFeedback' });
      expect(state.phase).toBe('playing');
    });
    expect(state.errorsInWord).toBe(5);
    expect(state.penaltySeconds).toBe(35);
  });

  it('tras un error las casillas se vacían al cerrar el feedback', () => {
    let state = fillWrong(newGame());
    state = gameReducer(state, { type: 'check', now: 2_000 });
    expect(state.phase).toBe('wrong');
    state = gameReducer(state, { type: 'dismissFeedback' });
    expect(state.slots).toEqual([null, null, null]);
  });

  it('el contador de errores se reinicia en cada palabra', () => {
    let state = fillWrong(newGame());
    state = gameReducer(state, { type: 'check', now: 2_000 });
    state = gameReducer(state, { type: 'dismissFeedback' });
    state = solve(state);
    state = gameReducer(state, { type: 'dismissFeedback' });
    expect(state.index).toBe(1);
    expect(state.errorsInWord).toBe(0);

    // El primer error de la palabra siguiente vuelve a costar 5 s.
    state = fillWrong(state);
    state = gameReducer(state, { type: 'check', now: 3_000 });
    expect(state.lastPenaltySeconds).toBe(5);
    expect(state.results[0]).toMatchObject({ errors: 1, penaltySeconds: 5 });
  });

  it('ignora acciones durante el feedback', () => {
    const state = solve(newGame());
    expect(gameReducer(state, { type: 'pickTile', tile: 0 })).toBe(state);
    expect(gameReducer(state, { type: 'rotateTiles' })).toBe(state);
  });
});

/** Rellena las 3 casillas con una combinación que no forma la palabra. */
function fillWrong(state: GameState): GameState {
  const solution = solutionOf(state);
  const distractor = [0, 1, 2, 3].find((tile) => !solution.includes(tile)) ?? 0;
  const [a = 0, b = 0] = solution;
  return run(state, { type: 'clearSlots' }, ...pick(a, b, distractor));
}

describe('saltar palabra', () => {
  it('pide confirmación antes de saltar', () => {
    const base = newGame();
    expect(gameReducer(base, { type: 'confirmSkip', now: 2_000 })).toBe(base);
  });

  it('al confirmar suma 35 s, muestra la respuesta y cuenta la palabra como hecha', () => {
    const state = run(
      newGame(),
      { type: 'armSkip' },
      { type: 'confirmSkip', now: 2_000 },
    );
    expect(state.phase).toBe('revealed');
    expect(state.penaltySeconds).toBe(SKIP_PENALTY_SECONDS);
    expect(state.slots).toEqual(solutionOf(state));
    expect(state.results[0]).toMatchObject({
      outcome: 'skipped',
      penaltySeconds: SKIP_PENALTY_SECONDS,
    });
  });

  it('se puede desarmar antes de confirmar', () => {
    const state = run(newGame(), { type: 'armSkip' }, { type: 'disarmSkip' });
    expect(state.skipArmed).toBe(false);
    expect(gameReducer(state, { type: 'confirmSkip', now: 2_000 })).toBe(state);
  });

  it('colocar una sílaba desarma el salto', () => {
    const state = run(newGame(), { type: 'armSkip' }, ...pick(0));
    expect(state.skipArmed).toBe(false);
  });

  it('tras la respuesta revelada se pasa a la palabra siguiente', () => {
    const state = run(
      newGame(),
      { type: 'armSkip' },
      { type: 'confirmSkip', now: 2_000 },
      { type: 'dismissFeedback' },
    );
    expect(state.index).toBe(1);
    expect(state.phase).toBe('playing');
    expect(state.lastPenaltySeconds).toBeNull();
  });
});

describe('fin de la partida', () => {
  function playThrough(): GameState {
    let state = newGame(1_000);
    for (let i = 0; i < 3; i++) {
      state = solve(state, 10_000 + i * 1_000);
      state = gameReducer(state, { type: 'dismissFeedback' });
    }
    return state;
  }

  it('termina al resolver la última palabra', () => {
    const state = playThrough();
    expect(state.phase).toBe('finished');
    expect(state.results).toHaveLength(3);
  });

  it('el reloj se detiene en el momento de resolver la última palabra', () => {
    const state = playThrough();
    expect(state.finishedAt).toBe(12_000);
    expect(elapsedMs(state, 99_999)).toBe(11_000);
  });

  it('el tiempo final incluye las penalizaciones', () => {
    let state = newGame(0);
    state = run(state, { type: 'armSkip' }, { type: 'confirmSkip', now: 2_000 });
    state = gameReducer(state, { type: 'dismissFeedback' });
    for (let i = 0; i < 2; i++) {
      state = solve(state, 10_000 + i * 1_000);
      state = gameReducer(state, { type: 'dismissFeedback' });
    }
    expect(state.phase).toBe('finished');
    expect(totalMs(state, 99_999)).toBe(11_000 + SKIP_PENALTY_SECONDS * 1000);
  });

  it('el resumen cuenta aciertos, saltos, errores y penalización', () => {
    let state = fillWrong(newGame(0));
    state = gameReducer(state, { type: 'check', now: 1_000 });
    state = gameReducer(state, { type: 'dismissFeedback' });
    state = solve(state);
    state = gameReducer(state, { type: 'dismissFeedback' });
    state = run(state, { type: 'armSkip' }, { type: 'confirmSkip', now: 6_000 });
    expect(summarize(state)).toEqual({
      solved: 1,
      skipped: 1,
      errors: 1,
      penaltySeconds: 5 + SKIP_PENALTY_SECONDS,
    });
  });
});
