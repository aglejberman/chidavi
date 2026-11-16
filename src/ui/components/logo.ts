import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';

/**
 * Logotipo: cuatro fichas, tres correctas (turquesa) y una distractora (rosa),
 * que resume la idea del juego. Es decorativo: el nombre ya lo dice el texto.
 */
export function logoMark(modifier: 'hero' | 'small'): TemplateResult {
  return html`<svg
    class="logo logo--${modifier}"
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
  >
    <rect class="logo__tile logo__tile--1" x="4" y="4" width="26" height="26" rx="7" />
    <rect class="logo__tile logo__tile--2" x="34" y="4" width="26" height="26" rx="7" />
    <rect class="logo__tile logo__tile--3" x="4" y="34" width="26" height="26" rx="7" />
    <rect
      class="logo__tile logo__tile--4 logo__tile--odd"
      x="34"
      y="34"
      width="26"
      height="26"
      rx="7"
    />
  </svg>`;
}
