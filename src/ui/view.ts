import { html, render } from 'lit-html';
import type { TemplateResult } from 'lit-html';
import type { ScreenContext } from './context';
import { countdownScreen } from './screens/countdown';
import { friendsScreen } from './screens/friends';
import { helpScreen } from './screens/help';
import { homeScreen } from './screens/home';
import { playScreen } from './screens/play';
import { resultScreen } from './screens/result';

export function screenFor(ctx: ScreenContext): TemplateResult {
  switch (ctx.state.screen) {
    case 'home':
      return homeScreen(ctx);
    case 'help':
      return helpScreen(ctx);
    case 'friends':
      return friendsScreen(ctx);
    case 'countdown':
      return countdownScreen(ctx);
    case 'play':
      return playScreen(ctx);
    case 'result':
      return resultScreen(ctx);
  }
}

/** Dibuja la pantalla actual; lit-html actualiza solo lo que cambió. */
export function renderApp(ctx: ScreenContext, root: HTMLElement): void {
  render(
    html`<div class="app" data-screen=${ctx.state.screen}>${screenFor(ctx)}</div>`,
    root,
  );
}
