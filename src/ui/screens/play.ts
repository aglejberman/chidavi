import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { areSlotsFull, currentWord, tileDisplayOrder, totalMs } from '../../core/game';
import type { GameState } from '../../core/game';
import { formatClock } from '../../core/format';
import { SKIP_PENALTY_SECONDS, SLOT_COUNT, WORDS_PER_GAME } from '../../core/rules';
import { iconBack, iconRotate, iconTrash } from '../components/icons';
import type { ScreenContext } from '../context';

function penaltyNotice(game: GameState): string {
  if (game.lastPenaltySeconds === null) return '';
  return game.lastPenaltySeconds > 0
    ? `+${game.lastPenaltySeconds} s`
    : 'Sin penalización';
}

export function playScreen({ state, dispatch, clock }: ScreenContext): TemplateResult {
  const game = state.game;
  if (!game) return html``;

  const word = currentWord(game);
  const isPlaying = game.phase === 'playing';
  const slotsFull = areSlotsFull(game);
  const armed = game.skipArmed;
  const notice = penaltyNotice(game);

  const slotHint =
    game.selectedSlot !== null
      ? 'Toca otra casilla para cambiar de lugar, o la misma para quitarla'
      : isPlaying
        ? 'Toca una sílaba colocada para moverla o quitarla'
        : '';

  const quit = (): void => {
    if (window.confirm('¿Salir de la partida? Se perderá el progreso.')) {
      dispatch({ type: 'goHome' });
    }
  };

  const toggleSkip = (): void => {
    dispatch({
      type: 'game',
      action: armed ? { type: 'confirmSkip', now: clock() } : { type: 'armSkip' },
    });
  };

  return html`
    <main class="screen screen--play">
      <header class="play-top">
        <button
          class="icon-button"
          type="button"
          aria-label="Salir de la partida"
          @click=${quit}
        >
          ${iconBack}
        </button>
        <span class="wordmark">Chidavi</span>
        <button
          class=${classMap({ chip: true, 'chip--skip': true, 'chip--armed': armed })}
          type="button"
          ?disabled=${!isPlaying}
          @click=${toggleSkip}
        >
          ${armed ? `¿Seguro? +${SKIP_PENALTY_SECONDS} s` : 'Saltar'}
        </button>
      </header>

      <section class="stats" aria-label="Progreso">
        <div class="stats__cell">
          <span class="stats__label">Palabra</span>
          <span class="stats__value">
            ${game.index + 1}<span class="stats__total"> / ${WORDS_PER_GAME}</span>
          </span>
        </div>
        <div class="stats__divider"></div>
        <div class="stats__cell">
          <span class="stats__label">Tiempo</span>
          <span class="stats__value" data-testid="clock"
            >${formatClock(totalMs(game, state.now))}</span
          >
        </div>
      </section>

      <div class="progress" aria-hidden="true">
        ${Array.from(
          { length: WORDS_PER_GAME },
          (_, i) =>
            html`<span
              class=${classMap({
                progress__step: true,
                'progress__step--done': i < game.index,
                'progress__step--current': i === game.index,
              })}
            ></span>`,
        )}
      </div>

      <div class="penalty-row">
        <span class="penalty-row__total"
          >Penalización acumulada: +${game.penaltySeconds} s</span
        >
        ${notice ? html`<span class="toast" role="status">${notice}</span>` : html``}
      </div>

      <p class="instruction">
        ${
          game.phase === 'revealed'
            ? html`La palabra era <strong>${word.word}</strong>.`
            : html`Una sílaba sobra. Forma la palabra<br />con las otras tres.`
        }
      </p>

      <div class="slots">
        <div class="slots__row">
          ${Array.from({ length: SLOT_COUNT }, (_, slot) => {
            const tile = game.slots[slot] ?? null;
            const text = tile === null ? '' : (word.tiles[tile] ?? '');
            return html`<button
              class=${classMap({
                slot: true,
                'slot--filled': tile !== null,
                'slot--selected': game.selectedSlot === slot,
                'slot--ok': game.phase === 'correct',
                'slot--wrong': game.phase === 'wrong',
                'slot--revealed': game.phase === 'revealed',
              })}
              type="button"
              ?disabled=${!isPlaying}
              aria-label=${`Casilla ${slot + 1}${tile === null ? ', vacía' : `: ${text}`}`}
              @click=${() => {
                dispatch({ type: 'game', action: { type: 'tapSlot', slot } });
              }}
            >
              ${text}
            </button>`;
          })}
          <button
            class="slot-clear"
            type="button"
            aria-label="Borrar todas las casillas"
            ?disabled=${!isPlaying}
            @click=${() => {
              dispatch({ type: 'game', action: { type: 'clearSlots' } });
            }}
          >
            ${iconTrash}
            <span>Borrar</span>
          </button>
        </div>
        <p class="hint">${slotHint}</p>
      </div>

      <div class="tiles">
        ${tileDisplayOrder(game).map((tile) => {
          const used = game.slots.includes(tile);
          return html`<button
            class=${classMap({ tile: true, 'tile--choice': true, 'tile--used': used })}
            type="button"
            ?disabled=${used || !isPlaying || slotsFull}
            @click=${() => {
              dispatch({ type: 'game', action: { type: 'pickTile', tile } });
            }}
          >
            ${word.tiles[tile]}
          </button>`;
        })}
      </div>

      <div class="rotate-row">
        <button
          class="chip chip--quiet"
          type="button"
          ?disabled=${!isPlaying}
          @click=${() => {
            dispatch({ type: 'game', action: { type: 'rotateTiles' } });
          }}
        >
          ${iconRotate} Rotar sílabas
        </button>
      </div>

      <div class="actions actions--bottom">
        <button
          class="btn btn--primary"
          type="button"
          ?disabled=${!isPlaying || !slotsFull}
          @click=${() => {
            dispatch({ type: 'game', action: { type: 'check', now: clock() } });
          }}
        >
          Comprobar
        </button>
      </div>
    </main>
  `;
}
