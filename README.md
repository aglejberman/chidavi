# Chidavi

Juego de palabras por sílabas. En cada palabra se muestran **cuatro sílabas: tres forman la
palabra y una sobra**. Hay que descubrir las diez palabras de la lista en el menor tiempo
posible, solo o entre amigos que juegan la misma lista desde sus teléfonos.

El nombre son las tres sílabas de «Davichi» desordenadas, como el propio juego. El juego lo
pensó David.

Es una **PWA** (aplicación web instalable): funciona en cualquier móvil desde el navegador,
se puede agregar a la pantalla de inicio y sigue funcionando sin conexión. No tiene servidor.

## Cómo se juega

1. Se muestran 4 sílabas (por ejemplo `o`, `sol`, `de`, `se`).
2. Una sobra (`sol`). Con las otras tres se forma la palabra (`de · se · o` → _deseo_).
3. Se completan 10 palabras. El tiempo final es el tiempo real más las penalizaciones.

Las reglas completas están en [`docs/REGLAS.md`](docs/REGLAS.md).

## Inicio rápido

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
```

Otros comandos:

| Comando             | Qué hace                                                    |
| ------------------- | ----------------------------------------------------------- |
| `npm test`          | Ejecuta los tests (Vitest)                                  |
| `npm run lint`      | Análisis estático (ESLint con reglas estrictas de tipos)    |
| `npm run format`    | Da formato al código (Prettier)                             |
| `npm run typecheck` | Comprueba los tipos (TypeScript en modo estricto)           |
| `npm run check`     | Lint + formato + tipos + tests (lo mismo que ejecuta la CI) |
| `npm run build`     | Genera la versión de producción en `dist/`                  |
| `npm run preview`   | Sirve `dist/` localmente (necesario para probar la PWA)     |

## Publicación en GitHub Pages

El repositorio incluye el flujo de trabajo `.github/workflows/deploy.yml`: en cada cambio
que llega a `main`, GitHub ejecuta las comprobaciones, compila y publica la web.

Configuración inicial (una sola vez):

1. Crear un repositorio **público** en GitHub y subir este proyecto.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Subir un cambio a `main`. Al terminar el flujo, la web queda en
   `https://<usuario>.github.io/<repositorio>/`.

Los jugadores abren ese enlace en el móvil. Para instalarla: menú del navegador →
«Agregar a la pantalla de inicio».

## Estructura

```
src/
  core/        Reglas del juego: funciones puras, sin interfaz ni navegador
  app/         Estado de la aplicación: reductor, almacén y efectos con tiempo
  ui/          Pantallas (lit-html) y componentes
  platform/    Acceso a APIs del navegador (portapapeles, bloqueo de pantalla)
  data/        Banco de palabras (bank.json)
  styles/      Hoja de estilos
tests/         Tests unitarios y de interfaz
e2e/           Prueba de humo en un navegador real (opcional)
tools/         Herramientas para mantener el banco de palabras
docs/          Reglas del juego y arquitectura
```

La arquitectura y sus decisiones se explican en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Banco de palabras

El banco vive en `src/data/bank.json`. Cada entrada tiene la palabra, sus tres sílabas y una
sílaba distractora. **Cada caso debe tener una sola solución**: entre las ordenaciones
posibles de tres de las cuatro sílabas, solo la palabra prevista debe existir en español.

```bash
pip install -r tools/requirements.txt

# Comprobar que todo el banco cumple la regla de solución única
python tools/bank_tools.py validate

# Proponer distractores para palabras nuevas (ver tools/candidates.example.txt)
python tools/bank_tools.py suggest tools/candidates.example.txt --start-id 101
```

La existencia de una palabra se decide con una lista de frecuencias (`wordfreq`), que no es
un diccionario oficial: los casos que la herramienta propone deben revisarse a mano.

**Al cambiar el banco hay que subir `BANK_VERSION`** (`src/core/bank.ts`) y registrar la
nueva huella en `tests/bank-version.test.ts`. El código de lista incluye la versión: así dos
teléfonos con bancos distintos no creen que juegan la misma lista. Un test lo recuerda.

## Prueba de humo en navegador (opcional)

`e2e/smoke.mjs` juega una partida completa en un móvil virtual (errores, salto, rotación,
reacomodo, resultado y modo sin conexión). Requiere Playwright:

```bash
npm install --no-save playwright && npx playwright install chromium
npm run build && npm run preview &
BASE_URL=http://localhost:4173/ node e2e/smoke.mjs
```

## Alcance de esta versión

Es un _proof of concept_. Queda fuera a propósito:

- **Servidor:** no hay cuentas, ranking ni partidas en vivo. Los amigos comparan su tiempo
  en persona.
- **Compartir resultados** y estadísticas históricas.
- **Protección del banco:** el banco viaja dentro de la app y cualquiera puede leerlo.
  Protegerlo exigiría un servidor que entregue una palabra por vez.

## Licencia

Sin licencia definida todavía (todos los derechos reservados).
