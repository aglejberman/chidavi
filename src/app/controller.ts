import type { ScreenWakeLock } from '../platform/wakeLock';
import type { GamePhase } from '../core/game';
import type { Store } from './store';
import type { AppAction, AppState } from './state';

/** Duración de cada paso de la cuenta atrás. */
export const COUNTDOWN_STEP_MS = 1000;
/** Tiempo que se muestra "¡Ya!" antes de empezar a jugar. */
export const GO_DELAY_MS = 700;
/** Frecuencia de actualización del reloj. */
export const CLOCK_INTERVAL_MS = 250;
/** Tiempo que el botón "Saltar" espera confirmación antes de desarmarse. */
export const SKIP_CONFIRM_MS = 3000;
/** Duración del feedback transitorio de cada fase. */
export const FEEDBACK_MS: Partial<Record<GamePhase, number>> = {
  wrong: 700,
  correct: 800,
  revealed: 2200,
};

type AppStore = Store<AppState, AppAction>;

/**
 * Efectos secundarios de la aplicación: temporizadores y bloqueo de pantalla.
 *
 * El reductor es puro; todo lo que depende del paso del tiempo vive aquí. En cada
 * cambio de estado se reconcilian los temporizadores con lo que el estado necesita.
 * Devuelve una función para detener todo.
 */
export function startEffects(
  store: AppStore,
  wakeLock: ScreenWakeLock,
  now: () => number = Date.now,
): () => void {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const cancel = (key: string): void => {
    const timer = timers.get(key);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(key);
  };

  const schedule = (key: string, delayMs: number, action: () => void): void => {
    if (timers.has(key)) return;
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        action();
      }, delayMs),
    );
  };

  const sync = (state: AppState): void => {
    // Cuenta atrás: baja un número por segundo y, al llegar a "¡Ya!", empieza la partida.
    if (state.screen === 'countdown' && state.countdown) {
      if (state.countdown.remaining > 0) {
        cancel('go');
        schedule('countdown', COUNTDOWN_STEP_MS, () => {
          store.dispatch({ type: 'countdownTick' });
        });
      } else {
        cancel('countdown');
        schedule('go', GO_DELAY_MS, () => {
          store.dispatch({ type: 'startGame', now: now() });
        });
      }
    } else {
      cancel('countdown');
      cancel('go');
    }

    const game = state.screen === 'play' ? state.game : null;
    const running = game !== null && game.phase !== 'finished';

    // Reloj.
    if (running) {
      schedule('clock', CLOCK_INTERVAL_MS, () => {
        store.dispatch({ type: 'tick', now: now() });
      });
    } else {
      cancel('clock');
    }

    // Cierre del feedback (acierto, error o respuesta revelada).
    const feedbackMs = game ? FEEDBACK_MS[game.phase] : undefined;
    if (feedbackMs !== undefined) {
      schedule('feedback', feedbackMs, () => {
        store.dispatch({ type: 'game', action: { type: 'dismissFeedback' } });
      });
    } else {
      cancel('feedback');
    }

    // El botón "Saltar" pide confirmación y se desarma solo.
    if (game?.skipArmed) {
      schedule('skipArm', SKIP_CONFIRM_MS, () => {
        store.dispatch({ type: 'game', action: { type: 'disarmSkip' } });
      });
    } else {
      cancel('skipArm');
    }

    // Pantalla encendida mientras se juega.
    if (running) void wakeLock.acquire();
    else void wakeLock.release();
  };

  const unsubscribe = store.subscribe(sync);
  const onVisibilityChange = (): void => {
    // El navegador libera el bloqueo al ocultar la página: se vuelve a pedir al volver.
    if (document.visibilityState === 'visible') sync(store.getState());
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  sync(store.getState());

  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    [...timers.keys()].forEach(cancel);
    void wakeLock.release();
  };
}
