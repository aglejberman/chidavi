import { parseCode } from '../core/code';
import { createGame, gameReducer } from '../core/game';
import { buildGameWords } from '../core/list';
import type { WordCase } from '../core/types';
import { COUNTDOWN_START } from './state';
import type { AppAction, AppState } from './state';

export interface AppConfig {
  readonly bank: readonly WordCase[];
  readonly bankVersion: number;
}

/** Crea el reductor de la aplicación para un banco de palabras concreto. */
export function createAppReducer(config: AppConfig) {
  return function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
      case 'goHome':
        return { ...state, screen: 'home', countdown: null, game: null };

      case 'goHelp':
        return { ...state, screen: 'help' };

      case 'goFriends':
        return {
          ...state,
          screen: 'friends',
          friendsCode: action.code,
          friendsNotice: null,
        };

      case 'loadFriendsCode': {
        const parsed = parseCode(action.input, config.bankVersion);
        if (!parsed.ok) {
          return { ...state, friendsNotice: { kind: 'error', reason: parsed.reason } };
        }
        return { ...state, friendsCode: parsed.code, friendsNotice: { kind: 'loaded' } };
      }

      case 'friendsCodeCopied':
        return { ...state, friendsNotice: { kind: 'copied' } };

      case 'startCountdown':
        return {
          ...state,
          screen: 'countdown',
          countdown: { code: action.code, remaining: COUNTDOWN_START },
          game: null,
        };

      case 'countdownTick': {
        if (state.screen !== 'countdown' || !state.countdown) return state;
        if (state.countdown.remaining <= 0) return state;
        return {
          ...state,
          countdown: { ...state.countdown, remaining: state.countdown.remaining - 1 },
        };
      }

      case 'startGame': {
        if (state.screen !== 'countdown' || !state.countdown) return state;
        const parsed = parseCode(state.countdown.code, config.bankVersion);
        if (!parsed.ok) return state;
        const words = buildGameWords(parsed.seed, config.bank);
        return {
          ...state,
          screen: 'play',
          now: action.now,
          countdown: null,
          game: createGame(parsed.code, words, action.now),
        };
      }

      case 'tick':
        return state.screen === 'play' ? { ...state, now: action.now } : state;

      case 'game': {
        if (state.screen !== 'play' || !state.game) return state;
        const game = gameReducer(state.game, action.action);
        if (game === state.game) return state;
        return {
          ...state,
          game,
          screen: game.phase === 'finished' ? 'result' : state.screen,
        };
      }
    }
  };
}
