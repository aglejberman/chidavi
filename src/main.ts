import '@fontsource/fredoka/latin-300.css';
import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-500.css';
import './styles/main.css';

import { registerSW } from 'virtual:pwa-register';
import { createAppReducer } from './app/reducer';
import { startEffects } from './app/controller';
import { createInitialState } from './app/state';
import type { AppAction, AppState } from './app/state';
import { createStore } from './app/store';
import { BANK_VERSION, parseBank } from './core/bank';
import { generateCode } from './core/code';
import { ScreenWakeLock } from './platform/wakeLock';
import bankData from './data/bank.json';
import { renderApp } from './ui/view';

const root = document.getElementById('app');
if (!root) throw new Error('No se encontró el contenedor #app');

const bank = parseBank(bankData);
const store = createStore<AppState, AppAction>(
  createInitialState(Date.now()),
  createAppReducer({ bank, bankVersion: BANK_VERSION }),
);

const draw = (state: AppState): void => {
  renderApp(
    {
      state,
      dispatch: store.dispatch,
      bankSize: bank.length,
      createCode: () => generateCode(BANK_VERSION),
      clock: Date.now,
    },
    root,
  );
};

store.subscribe(draw);
startEffects(store, new ScreenWakeLock());
draw(store.getState());

// Service worker: permite instalar la app y jugar sin conexión.
registerSW({ immediate: true });
