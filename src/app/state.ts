import type { CodeError } from '../core/code';
import type { GameAction, GameState } from '../core/game';

export type Screen = 'home' | 'help' | 'friends' | 'countdown' | 'play' | 'result';

/** Mensaje mostrado en la sala de amigos tras cargar o copiar un código. */
export type FriendsNotice =
  | { readonly kind: 'loaded' }
  | { readonly kind: 'copied' }
  | { readonly kind: 'error'; readonly reason: CodeError };

export interface AppState {
  readonly screen: Screen;
  /** Hora actual (ms), actualizada por el reloj mientras se juega. */
  readonly now: number;
  /** Código de la lista que se está preparando en la sala de amigos. */
  readonly friendsCode: string;
  readonly friendsNotice: FriendsNotice | null;
  /** Cuenta atrás: código de la lista que se va a jugar y número que se muestra. */
  readonly countdown: { readonly code: string; readonly remaining: number } | null;
  readonly game: GameState | null;
}

export type AppAction =
  | { readonly type: 'goHome' }
  | { readonly type: 'goHelp' }
  | { readonly type: 'goFriends'; readonly code: string }
  | { readonly type: 'loadFriendsCode'; readonly input: string }
  | { readonly type: 'friendsCodeCopied' }
  | { readonly type: 'startCountdown'; readonly code: string }
  | { readonly type: 'countdownTick' }
  | { readonly type: 'startGame'; readonly now: number }
  | { readonly type: 'tick'; readonly now: number }
  | { readonly type: 'game'; readonly action: GameAction };

export const COUNTDOWN_START = 3;

export function createInitialState(now: number): AppState {
  return {
    screen: 'home',
    now,
    friendsCode: '',
    friendsNotice: null,
    countdown: null,
    game: null,
  };
}
