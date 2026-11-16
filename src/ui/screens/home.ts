import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import type { ScreenContext } from '../context';
import { GAME_NAME } from '../../brand';
import { iconHelp } from '../components/icons';
import { logoMark } from '../components/logo';

export function homeScreen({
  dispatch,
  bankSize,
  createCode,
}: ScreenContext): TemplateResult {
  return html`
    <main class="screen screen--home">
      <div class="screen__top screen__top--end">
        <button
          class="chip"
          type="button"
          @click=${() => {
            dispatch({ type: 'goHelp' });
          }}
        >
          ${iconHelp} Cómo se juega
        </button>
      </div>

      <div class="hero">
        ${logoMark('hero')}
        <h1 class="title">${GAME_NAME}</h1>
        <p class="subtitle">
          Cuatro sílabas, una sobra.<br />Diez palabras por descubrir.
        </p>
      </div>

      <div class="actions">
        <button
          class="btn btn--primary"
          type="button"
          @click=${() => {
            dispatch({ type: 'startCountdown', code: createCode() });
          }}
        >
          Jugar solo
        </button>
        <button
          class="btn btn--outline"
          type="button"
          @click=${() => {
            dispatch({ type: 'goFriends', code: createCode() });
          }}
        >
          Jugar con amigos
        </button>
        <p class="footnote">Versión de prueba · ${bankSize} palabras</p>
      </div>
    </main>
  `;
}
