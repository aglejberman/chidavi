import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import { WORDS_PER_GAME } from '../../core/rules';
import { iconBack } from '../components/icons';
import type { ScreenContext } from '../context';

export function countdownScreen({ state, dispatch }: ScreenContext): TemplateResult {
  const countdown = state.countdown;
  const remaining = countdown?.remaining ?? 0;
  const label = remaining > 0 ? String(remaining) : '¡Ya!';

  return html`
    <main class="screen screen--countdown">
      <header class="screen__top">
        <button
          class="icon-button"
          type="button"
          aria-label="Cancelar y volver al inicio"
          @click=${() => {
            dispatch({ type: 'goHome' });
          }}
        >
          ${iconBack}
        </button>
      </header>

      <div class="countdown">
        <p class="countdown__label">Prepárate</p>
        <div class="countdown__ring" role="timer" aria-live="assertive">
          <span
            class=${remaining > 0 ? 'countdown__value' : 'countdown__value countdown__value--go'}
            >${label}</span
          >
        </div>
        <p class="footnote">
          Lista ${countdown?.code ?? ''} · ${WORDS_PER_GAME} palabras<br />El tiempo
          arranca en «¡Ya!»
        </p>
      </div>
    </main>
  `;
}
