import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import type { ScreenContext } from '../context';
import { iconHelp } from '../components/icons';

const LOGO_SYLLABLES = ['chi', 'da', 'vi'] as const;

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
        <div class="tile-row" aria-hidden="true">
          ${LOGO_SYLLABLES.map((syllable) => html`<span class="tile tile--hero">${syllable}</span>`)}
        </div>
        <h1 class="title">Chidavi</h1>
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
