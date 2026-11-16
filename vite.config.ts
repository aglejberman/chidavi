import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// Rutas relativas (`base: './'`) para que la app funcione tanto en la raíz de un
// dominio como en un subdirectorio, como ocurre en GitHub Pages
// (https://usuario.github.io/<repositorio>/).
export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Silabeo',
        short_name: 'Silabeo',
        description: 'Cuatro sílabas, una sobra. Diez palabras por descubrir.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#14213d',
        theme_color: '#14213d',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
