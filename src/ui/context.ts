import type { AppAction, AppState } from '../app/state';

/** Lo que cada pantalla necesita para dibujarse y reaccionar. */
export interface ScreenContext {
  readonly state: AppState;
  readonly dispatch: (action: AppAction) => void;
  /** Cantidad de palabras del banco (se muestra en la pantalla de inicio). */
  readonly bankSize: number;
  /** Genera un código de lista nuevo. */
  readonly createCode: () => string;
  /** Hora actual en ms. */
  readonly clock: () => number;
}
