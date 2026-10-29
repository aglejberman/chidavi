// Genera los iconos de la PWA a partir de un SVG (requiere Playwright instalado).
// Uso: node tools/make_icons.mjs
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const NAVY = '#14213d';
const TEAL = '#2ec4b6';
const PINK = '#ff8fa3';

/** Cuadrícula de 2x2 fichas: tres válidas y una distractora (rosada). */
function iconSvg({ size, tile, gap, radius, background }) {
  const total = tile * 2 + gap;
  const start = (size - total) / 2;
  const positions = [
    [start, start, TEAL],
    [start + tile + gap, start, TEAL],
    [start, start + tile + gap, TEAL],
    [start + tile + gap, start + tile + gap, PINK],
  ];
  const rects = positions
    .map(
      ([x, y, fill]) =>
        `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${radius}" fill="${fill}"/>`,
    )
    .join('');
  const bg = background ? `<rect width="${size}" height="${size}" fill="${NAVY}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${rects}</svg>`;
}

const variants = {
  'public/icons/icon-512.png': {
    size: 512,
    tile: 190,
    gap: 24,
    radius: 40,
    background: true,
  },
  'public/icons/icon-192.png': {
    size: 512,
    tile: 190,
    gap: 24,
    radius: 40,
    background: true,
    out: 192,
  },
  'public/icons/apple-touch-icon.png': {
    size: 512,
    tile: 190,
    gap: 24,
    radius: 40,
    background: true,
    out: 180,
  },
  // Maskable: el contenido debe caber en el 80 % central.
  'public/icons/icon-maskable-512.png': {
    size: 512,
    tile: 150,
    gap: 20,
    radius: 32,
    background: true,
  },
};

mkdirSync('public/icons', { recursive: true });
writeFileSync(
  'public/favicon.svg',
  iconSvg({ size: 64, tile: 24, gap: 4, radius: 6, background: true }),
);

const browser = await chromium.launch();
for (const [file, { out, ...options }] of Object.entries(variants)) {
  const target = out ?? options.size;
  const page = await browser.newPage({ viewport: { width: target, height: target } });
  const svg = iconSvg(options);
  await page.setContent(
    `<body style="margin:0;background:${NAVY}">${svg.replace(
      '<svg ',
      `<svg style="width:${target}px;height:${target}px;display:block" `,
    )}</body>`,
  );
  await page.screenshot({ path: file });
  await page.close();
}
await browser.close();
console.log('Iconos generados');
