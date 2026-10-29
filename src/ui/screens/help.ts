import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { ERROR_PENALTIES_SECONDS, WORDS_PER_GAME } from '../../core/rules';
import { iconBack } from '../components/icons';
import type { ScreenContext } from '../context';

const EXAMPLE_TILES = ['o', 'sol', 'de', 'se'] as const;
const DISCARDED = 'sol';

function miniTile(
  text: string,
  state: 'normal' | 'discarded' = 'normal',
): TemplateResult {
  return html`<span
    class=${classMap({ tile: true, 'tile--mini': true, 'tile--discarded': state === 'discarded' })}
    >${text}</span
  >`;
}

function step(number: number, title: string, body: TemplateResult): TemplateResult {
  return html`
    <section class="card step">
      <h2 class="step__title"><span class="step__number">${number}</span> ${title}</h2>
      ${body}
    </section>
  `;
}

export function helpScreen({ dispatch }: ScreenContext): TemplateResult {
  const penalties = ERROR_PENALTIES_SECONDS.map((seconds) => `+${seconds} s`).join(', ');
  return html`
    <main class="screen screen--help">
      <header class="screen__top">
        <button
          class="icon-button"
          type="button"
          aria-label="Volver al inicio"
          @click=${() => {
            dispatch({ type: 'goHome' });
          }}
        >
          ${iconBack}
        </button>
        <h1 class="screen__title">Cómo se juega</h1>
      </header>

      ${step(
        1,
        'Mira las cuatro sílabas',
        html`<div class="tile-row tile-row--center">
          ${EXAMPLE_TILES.map((t) => miniTile(t))}
        </div>`,
      )}
      ${step(
        2,
        'Una sobra: descártala',
        html`<div class="tile-row tile-row--center">
          ${EXAMPLE_TILES.map((t) => miniTile(t, t === DISCARDED ? 'discarded' : 'normal'))}
        </div>`,
      )}
      ${step(
        3,
        'Ordena las otras tres',
        html`<div class="tile-row tile-row--center step__equation">
          <span class="tile tile--mini tile--slot">de</span>
          <span class="tile tile--mini tile--slot">se</span>
          <span class="tile tile--mini tile--slot">o</span>
          <span class="step__equals" aria-hidden="true">=</span>
          <strong class="step__result">deseo</strong>
        </div>`,
      )}

      <p class="help-note">
        Cada error en una misma palabra suma tiempo (${penalties}). Saltar una palabra
        suma más. Gana quien completa las ${WORDS_PER_GAME} palabras en menos tiempo.
      </p>

      <div class="actions">
        <button
          class="btn btn--primary"
          type="button"
          @click=${() => {
            dispatch({ type: 'goHome' });
          }}
        >
          Entendido
        </button>
      </div>
    </main>
  `;
}
