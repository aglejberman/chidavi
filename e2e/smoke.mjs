// Prueba de humo en un navegador real: recorre el juego completo en un móvil virtual.
// Requiere Playwright (npm i -D playwright) y la app compilada: `npm run build && npm run preview`.
// Uso: BASE_URL=http://localhost:4173/ SHOTS=./capturas node e2e/smoke.mjs
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173/';
const SHOTS = process.env.SHOTS ?? '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const bank = JSON.parse(
  readFileSync(new URL('../src/data/bank.json', import.meta.url), 'utf8'),
);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const shot = async (name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });
const clock = async () => page.getByTestId('clock').innerText();
const seconds = (text) => {
  const [m, s] = text.split(':').map(Number);
  return m * 60 + s;
};

/** Devuelve las fichas visibles en el orden de pantalla. */
const visibleTiles = async () => page.locator('.tile--choice').allInnerTexts();

/** Clicks necesarios para formar la palabra actual, deducida del banco. */
async function solutionClicks() {
  const tiles = (await visibleTiles()).map((t) => t.trim());
  const entry = bank.find((c) => c.syllables.every((s) => tiles.includes(s)));
  assert.ok(entry, `ninguna palabra del banco encaja con ${tiles}`);
  return { entry, order: entry.syllables.map((s) => tiles.indexOf(s)) };
}

try {
  // --- Inicio y ayuda
  await page.goto(BASE_URL);
  await page.getByRole('heading', { name: 'Chidavi' }).waitFor();
  await shot('1-inicio');
  await page.getByRole('button', { name: /Cómo se juega/ }).click();
  await shot('2-ayuda');
  await page.getByRole('button', { name: 'Entendido' }).click();

  // --- Amigos
  await page.getByRole('button', { name: 'Jugar con amigos' }).click();
  await page.locator('.tile--code').first().waitFor();
  await shot('3-amigos');
  const code = (await page.locator('.tile--code').allInnerTexts()).join('');
  assert.equal(code.length, 5);
  await page.fill('#friends-code', 'ZZZZZ');
  await page.getByRole('button', { name: 'Cargar' }).click();
  assert.match(await page.locator('#friends-notice').innerText(), /no válido/);
  await page.fill('#friends-code', code.toLowerCase());
  await page.getByRole('button', { name: 'Cargar' }).click();
  assert.match(await page.locator('#friends-notice').innerText(), /cargada/);

  // --- Cuenta atrás: pasa sola al juego
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.locator('.countdown__value').waitFor();
  await shot('4-cuenta-atras');
  await page.locator('.screen--play').waitFor({ timeout: 8000 });
  await shot('5-juego');
  assert.equal(await clock(), '00:00');

  // --- Palabra 1: un error (+5 s), reacomodar y acertar
  let { entry, order } = await solutionClicks();
  const wrongOrder = [order[1], order[0], order[2]];
  const tilesLocator = page.locator('.tile--choice');
  for (const i of wrongOrder) await tilesLocator.nth(i).click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await shot('6-error');
  assert.match(await page.locator('.toast').innerText(), /\+5 s/);
  await page
    .locator('.slot--wrong')
    .first()
    .waitFor({ state: 'detached', timeout: 3000 });

  // Rotar: las fichas cambian de lugar
  const before = await visibleTiles();
  await page.getByRole('button', { name: /Rotar/ }).click();
  const after = await visibleTiles();
  assert.deepEqual(after, [...before.slice(1), before[0]]);
  ({ order } = await solutionClicks());

  // Reacomodar: colocar en orden incorrecto, intercambiar las dos primeras casillas
  for (const i of [order[1], order[0], order[2]]) await tilesLocator.nth(i).click();
  await page.locator('.slot').nth(0).click();
  await page.locator('.slot').nth(1).click();
  await shot('7-reacomodar');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.locator('.slot--ok').first().waitFor();
  await shot('8-acierto');
  await page.locator('.slot--ok').first().waitFor({ state: 'detached', timeout: 3000 });
  assert.ok(seconds(await clock()) >= 5, 'el reloj incluye la penalización');

  // --- Palabra 2: saltar (+35 s) con confirmación
  assert.match(await page.locator('.stats').innerText(), /2\s*\/ 10/);
  await page.getByRole('button', { name: 'Saltar' }).click();
  assert.match(await page.getByRole('button', { name: /Seguro/ }).innerText(), /\+35 s/);
  await page.getByRole('button', { name: /Seguro/ }).click();
  await page.locator('.slot--revealed').first().waitFor();
  await shot('9-saltar');
  await page
    .locator('.slot--revealed')
    .first()
    .waitFor({ state: 'detached', timeout: 5000 });
  assert.ok(seconds(await clock()) >= 40, 'el reloj suma 5 s + 35 s');

  // --- Palabras 3 a 10
  for (let n = 3; n <= 10; n++) {
    assert.match(await page.locator('.stats').innerText(), new RegExp(`${n}\\s*/ 10`));
    ({ order } = await solutionClicks());
    for (const i of order) await tilesLocator.nth(i).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    if (n < 10)
      await page
        .locator('.slot--ok')
        .first()
        .waitFor({ state: 'detached', timeout: 3000 });
  }

  // --- Resultado
  await page.locator('.screen--result').waitFor({ timeout: 4000 });
  await shot('10-resultado');
  const finalTime = await page.getByTestId('final-time').innerText();
  assert.ok(seconds(finalTime) >= 40, `tiempo final ${finalTime}`);
  assert.equal(await page.locator('.pill').count(), 10);
  assert.equal(await page.locator('.pill--warn').count(), 2);
  assert.match(await page.locator('.result-head').innerText(), new RegExp(code));

  // --- Sin conexión: la app instalada sigue funcionando
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'Chidavi' }).waitFor();
  await context.setOffline(false);

  assert.deepEqual(errors, [], `errores en consola: ${errors.join(' | ')}`);
  console.log(
    'E2E OK: partida completa, penalizaciones, salto, rotación, reacomodo y modo sin conexión',
  );
} finally {
  await browser.close();
}
