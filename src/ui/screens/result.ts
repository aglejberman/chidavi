import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { elapsedMs, summarize, totalMs } from '../../core/game';
import type { WordResult } from '../../core/game';
import { formatClock } from '../../core/format';
import type { ScreenContext } from '../context';

function resultLabel(result: WordResult): string {
  if (result.outcome === 'skipped') return `${result.word} · saltada`;
  if (result.errors === 0) return result.word;
  return `${result.word} · ${result.errors} ${result.errors === 1 ? 'error' : 'errores'}`;
}

export function resultScreen({
  state,
  dispatch,
  createCode,
}: ScreenContext): TemplateResult {
  const game = state.game;
  if (!game) return html``;

  const summary = summarize(game);

  return html`
    <main class="screen screen--result">
      <header class="result-head">
        <p class="result-head__title">¡Lista completa!</p>
        <p class="result-head__time" data-testid="final-time">
          ${formatClock(totalMs(game, state.now))}
        </p>
        <p class="footnote">Tiempo final · lista ${game.code}</p>
      </header>

      <div class="stat-cards">
        <div class="card stat-card">
          <span class="stat-card__label">Tiempo de juego</span>
          <span class="stat-card__value">${formatClock(elapsedMs(game, state.now))}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-card__label">Penalizaciones</span>
          <span class="stat-card__value stat-card__value--penalty"
            >+${formatClock(summary.penaltySeconds * 1000)}</span
          >
        </div>
      </div>

      <section class="card">
        <h2 class="card__title">Tus palabras</h2>
        <ul class="pills">
          ${game.results.map(
            (result) =>
              html`<li
                class=${classMap({
                  pill: true,
                  'pill--ok': result.outcome === 'solved' && result.errors === 0,
                  'pill--warn': result.outcome === 'skipped' || result.errors > 0,
                })}
              >
                ${resultLabel(result)}
              </li>`,
          )}
        </ul>
      </section>

      <div class="actions">
        <button
          class="btn btn--primary"
          type="button"
          @click=${() => {
            dispatch({ type: 'startCountdown', code: createCode() });
          }}
        >
          Jugar otra lista
        </button>
        <button
          class="btn btn--link"
          type="button"
          @click=${() => {
            dispatch({ type: 'goHome' });
          }}
        >
          Volver al inicio
        </button>
      </div>
    </main>
  `;
}
