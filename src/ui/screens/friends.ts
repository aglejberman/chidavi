import { html } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import { CODE_LENGTH } from '../../core/code';
import type { FriendsNotice } from '../../app/state';
import { copyText, shareText } from '../../platform/share';
import { iconBack } from '../components/icons';
import type { ScreenContext } from '../context';

function noticeText(notice: FriendsNotice | null, code: string): string {
  if (!notice) return '';
  switch (notice.kind) {
    case 'loaded':
      return `Lista ${code} cargada.`;
    case 'copied':
      return 'Código copiado.';
    case 'error':
      switch (notice.reason) {
        case 'length':
          return `El código tiene ${CODE_LENGTH} caracteres.`;
        case 'characters':
          return 'El código solo usa letras y números.';
        case 'checksum':
          return 'Código no válido o de otra versión de Chidavi.';
      }
  }
}

export function friendsScreen({
  state,
  dispatch,
  createCode,
}: ScreenContext): TemplateResult {
  const code = state.friendsCode;
  const notice = state.friendsNotice;

  const copy = async (): Promise<void> => {
    if (await copyText(code)) dispatch({ type: 'friendsCodeCopied' });
  };

  const share = async (): Promise<void> => {
    const url = `${location.origin}${location.pathname}`;
    const shared = await shareText(
      'Chidavi',
      `Juega conmigo a Chidavi. Código de la lista: ${code}\n${url}`,
    );
    if (!shared) await copy();
  };

  const loadCode = (event: SubmitEvent): void => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const input = new FormData(form).get('code');
    dispatch({ type: 'loadFriendsCode', input: typeof input === 'string' ? input : '' });
  };

  const isError = notice?.kind === 'error';

  return html`
    <main class="screen screen--friends">
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
        <h1 class="screen__title">Jugar con amigos</h1>
      </header>

      <section class="card">
        <h2 class="card__title">Lista actual</h2>
        <p class="card__text">
          Todos juegan las mismas 10 palabras. Compartan este código o carguen el de un
          amigo.
        </p>
        <div
          class="tile-row tile-row--center"
          role="group"
          aria-label=${`Código ${code}`}
        >
          ${Array.from(code, (char) => html`<span class="tile tile--code">${char}</span>`)}
        </div>
        <div class="button-row">
          <button class="btn btn--ghost" type="button" @click=${copy}>Copiar</button>
          <button class="btn btn--ghost" type="button" @click=${share}>Compartir</button>
          <button
            class="btn btn--ghost"
            type="button"
            @click=${() => {
              dispatch({ type: 'goFriends', code: createCode() });
            }}
          >
            Nueva
          </button>
        </div>
      </section>

      <section class="card">
        <form @submit=${loadCode} novalidate>
          <label class="card__title" for="friends-code">Tengo un código</label>
          <div class="field">
            <input
              id="friends-code"
              name="code"
              class="field__input"
              type="text"
              inputmode="text"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              maxlength="12"
              placeholder="K7M2Q"
              aria-describedby="friends-notice"
              aria-invalid=${isError ? 'true' : 'false'}
            />
            <button class="btn btn--primary btn--compact" type="submit">Cargar</button>
          </div>
        </form>
        <p
          id="friends-notice"
          class=${isError ? 'notice notice--error' : 'notice'}
          role="status"
        >
          ${noticeText(notice, code)}
        </p>
      </section>

      <div class="actions">
        <p class="footnote">
          Cuando todos tengan la lista, cuenten juntos y toquen Empezar al mismo tiempo.
        </p>
        <button
          class="btn btn--primary"
          type="button"
          @click=${() => {
            dispatch({ type: 'startCountdown', code });
          }}
        >
          Empezar
        </button>
      </div>
    </main>
  `;
}
