import { describe, expect, it } from 'vitest';
import { createAppReducer } from '../src/app/reducer';
import { COUNTDOWN_START, createInitialState } from '../src/app/state';
import type { AppAction, AppState } from '../src/app/state';
import { createStore } from '../src/app/store';
import { BANK_VERSION } from '../src/core/bank';
import { generateCode } from '../src/core/code';
import { createRng } from '../src/core/random';
import { currentWord } from '../src/core/game';
import { bank } from './helpers';

const reducer = createAppReducer({ bank, bankVersion: BANK_VERSION });
const code = generateCode(BANK_VERSION, createRng(11));

function run(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(reducer, state);
}

const start = () => createInitialState(1_000);

describe('navegación', () => {
  it('empieza en el inicio', () => {
    expect(start().screen).toBe('home');
  });

  it('abre la ayuda y vuelve al inicio', () => {
    const state = run(start(), { type: 'goHelp' });
    expect(state.screen).toBe('help');
    expect(run(state, { type: 'goHome' }).screen).toBe('home');
  });
});

describe('sala de amigos', () => {
  it('muestra el código generado', () => {
    const state = run(start(), { type: 'goFriends', code });
    expect(state.screen).toBe('friends');
    expect(state.friendsCode).toBe(code);
  });

  it('carga un código válido de un amigo', () => {
    const friend = generateCode(BANK_VERSION, createRng(12));
    const state = run(
      start(),
      { type: 'goFriends', code },
      { type: 'loadFriendsCode', input: friend.toLowerCase() },
    );
    expect(state.friendsCode).toBe(friend);
    expect(state.friendsNotice).toEqual({ kind: 'loaded' });
  });

  it('rechaza un código inválido y conserva el actual', () => {
    const state = run(
      start(),
      { type: 'goFriends', code },
      { type: 'loadFriendsCode', input: 'ZZZZZ' },
    );
    expect(state.friendsCode).toBe(code);
    expect(state.friendsNotice?.kind).toBe('error');
  });
});

describe('cuenta atrás y partida', () => {
  it('la cuenta atrás baja de 3 a 0 y no pasa de ahí', () => {
    let state = run(start(), { type: 'startCountdown', code });
    expect(state.countdown?.remaining).toBe(COUNTDOWN_START);
    for (let i = 0; i < 5; i++) state = run(state, { type: 'countdownTick' });
    expect(state.countdown?.remaining).toBe(0);
  });

  it('al terminar la cuenta atrás empieza la partida con 10 palabras', () => {
    const state = run(
      start(),
      { type: 'startCountdown', code },
      { type: 'startGame', now: 5_000 },
    );
    expect(state.screen).toBe('play');
    expect(state.game?.words).toHaveLength(10);
    expect(state.game?.startedAt).toBe(5_000);
    expect(state.countdown).toBeNull();
  });

  it('el mismo código genera la misma partida en dos dispositivos', () => {
    const a = run(
      start(),
      { type: 'startCountdown', code },
      { type: 'startGame', now: 1 },
    );
    const b = run(
      start(),
      { type: 'startCountdown', code },
      { type: 'startGame', now: 2 },
    );
    expect(a.game?.words).toEqual(b.game?.words);
  });

  it('el reloj solo avanza mientras se juega', () => {
    expect(run(start(), { type: 'tick', now: 9_000 }).now).toBe(1_000);
    const playing = run(
      start(),
      { type: 'startCountdown', code },
      { type: 'startGame', now: 5_000 },
    );
    expect(run(playing, { type: 'tick', now: 9_000 }).now).toBe(9_000);
  });

  it('pasa a resultados al resolver las 10 palabras', () => {
    let state = run(
      start(),
      { type: 'startCountdown', code },
      { type: 'startGame', now: 0 },
    );
    for (let i = 0; i < 10; i++) {
      const game = state.game;
      if (!game) throw new Error('sin partida');
      const tiles = currentWord(game).solution;
      state = run(
        state,
        ...tiles.map((tile): AppAction => ({
          type: 'game',
          action: { type: 'pickTile', tile },
        })),
        { type: 'game', action: { type: 'check', now: 1_000 * (i + 1) } },
        { type: 'game', action: { type: 'dismissFeedback' } },
      );
    }
    expect(state.screen).toBe('result');
    expect(state.game?.results).toHaveLength(10);
  });

  it('volver al inicio descarta la partida', () => {
    const state = run(
      start(),
      { type: 'startCountdown', code },
      { type: 'startGame', now: 0 },
      { type: 'goHome' },
    );
    expect(state.screen).toBe('home');
    expect(state.game).toBeNull();
  });
});

describe('store', () => {
  it('notifica a los suscriptores solo cuando el estado cambia', () => {
    const store = createStore(start(), reducer);
    let calls = 0;
    store.subscribe(() => {
      calls++;
    });
    store.dispatch({ type: 'goHelp' });
    store.dispatch({ type: 'goHelp' });
    expect(calls).toBe(2);
    store.dispatch({ type: 'tick', now: 3 });
    expect(calls).toBe(2);
  });

  it('permite cancelar la suscripción', () => {
    const store = createStore(start(), reducer);
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls++;
    });
    unsubscribe();
    store.dispatch({ type: 'goHelp' });
    expect(calls).toBe(0);
  });
});
