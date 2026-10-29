// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppReducer } from '../src/app/reducer';
import { createInitialState } from '../src/app/state';
import type { AppAction, AppState } from '../src/app/state';
import { createStore } from '../src/app/store';
import { BANK_VERSION } from '../src/core/bank';
import { generateCode } from '../src/core/code';
import { createRng } from '../src/core/random';
import { renderApp } from '../src/ui/view';
import { bank } from './helpers';

const code = generateCode(BANK_VERSION, createRng(21));
let root: HTMLElement;

function mount() {
  const store = createStore<AppState, AppAction>(
    createInitialState(0),
    createAppReducer({ bank, bankVersion: BANK_VERSION }),
  );
  const draw = (state: AppState): void => {
    renderApp(
      {
        state,
        dispatch: store.dispatch,
        bankSize: bank.length,
        createCode: () => code,
        clock: () => 0,
      },
      root,
    );
  };
  store.subscribe(draw);
  draw(store.getState());
  return store;
}

const button = (label: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll('button')].find((b) =>
    b.textContent.replace(/\s+/g, ' ').includes(label),
  );
  if (!found) throw new Error(`No hay un botón "${label}"`);
  return found;
};

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  root = document.getElementById('root') as HTMLElement;
});

describe('interfaz', () => {
  it('muestra el inicio con los dos modos de juego', () => {
    mount();
    expect(root.querySelector('h1')?.textContent).toBe('Chidavi');
    expect(button('Jugar solo')).toBeTruthy();
    expect(button('Jugar con amigos')).toBeTruthy();
  });

  it('abre la ayuda y vuelve', () => {
    mount();
    button('Cómo se juega').click();
    expect(root.querySelector('h1')?.textContent).toBe('Cómo se juega');
    button('Entendido').click();
    expect(root.querySelector('h1')?.textContent).toBe('Chidavi');
  });

  it('en amigos muestra el código y valida el que se escribe', () => {
    mount();
    button('Jugar con amigos').click();
    expect(root.querySelectorAll('.tile--code')).toHaveLength(5);

    const input = root.querySelector<HTMLInputElement>('#friends-code');
    const form = root.querySelector('form');
    if (!input || !form) throw new Error('falta el formulario');
    input.value = 'ZZZZZ';
    form.dispatchEvent(new SubmitEvent('submit', { cancelable: true, bubbles: true }));
    expect(root.querySelector('.notice--error')?.textContent.trim()).toContain(
      'no válido',
    );
  });

  it('la cuenta atrás lleva a la pantalla de juego con la palabra 1 de 10', () => {
    const store = mount();
    button('Jugar solo').click();
    expect(root.querySelector('.countdown__value')?.textContent).toBe('3');
    store.dispatch({ type: 'startGame', now: 0 });
    expect(root.textContent).toContain('1 / 10');
    expect(root.querySelectorAll('.tile--choice')).toHaveLength(4);
    expect(root.querySelectorAll('.slot')).toHaveLength(3);
  });

  it('en el juego, "Comprobar" empieza deshabilitado y "Saltar" pide confirmación', () => {
    const store = mount();
    store.dispatch({ type: 'startCountdown', code });
    store.dispatch({ type: 'startGame', now: 0 });
    expect(button('Comprobar').disabled).toBe(true);

    button('Saltar').click();
    expect(button('¿Seguro?').textContent).toContain('+35 s');
  });

  it('tocar tres sílabas habilita "Comprobar"', () => {
    const store = mount();
    store.dispatch({ type: 'startCountdown', code });
    store.dispatch({ type: 'startGame', now: 0 });
    root.querySelectorAll<HTMLButtonElement>('.tile--choice').forEach((tile, i) => {
      if (i < 3) tile.click();
    });
    expect(button('Comprobar').disabled).toBe(false);
  });
});
