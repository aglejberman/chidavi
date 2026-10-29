# Arquitectura

## Principios

- **Separar las reglas de la interfaz.** Todo lo que define el juego vive en `src/core/` como
  funciones puras (sin DOM, sin reloj, sin azar oculto). Es lo más importante de probar y lo
  que menos debería cambiar cuando cambie la interfaz.
- **Estado único e inmutable, flujo en un solo sentido.** Las acciones del jugador producen un
  estado nuevo mediante un reductor; la interfaz solo dibuja el estado.
- **Lo que depende del tiempo está aislado.** El reductor no usa temporizadores: se le pasa la
  hora en las acciones. Los temporizadores viven en `src/app/controller.ts`.
- **Sin servidor y sin dependencias innecesarias.** TypeScript + Vite; la única librería de
  ejecución para la interfaz es `lit-html` (plantillas, ~3 KB). No hay framework.

## Capas

```
┌──────────────────────────────────────────────────────────────┐
│ ui/        Pantallas y componentes (lit-html)                │
│            dibujan el estado y envían acciones                │
├──────────────────────────────────────────────────────────────┤
│ app/       state · reducer · store · controller              │
│            navegación entre pantallas, temporizadores         │
├──────────────────────────────────────────────────────────────┤
│ core/      reglas · código de lista · lista de palabras      │
│            reductor de la partida (todo puro y testeable)     │
├──────────────────────────────────────────────────────────────┤
│ platform/  portapapeles, compartir, bloqueo de pantalla      │
└──────────────────────────────────────────────────────────────┘
```

Las dependencias van hacia abajo: `core` no conoce a nadie; `app` conoce a `core`; `ui`
conoce a `app` y `core`.

## Flujo de datos

```
 toque del jugador
        │
        ▼
  ui (handler) ── dispatch(action) ──▶ store ──▶ reducer ──▶ nuevo estado
        ▲                                                       │
        └──────────── render(estado) ◀── suscripción ───────────┘
                                                                │
                       controller (suscrito) ◀──────────────────┘
                       programa o cancela temporizadores y el
                       bloqueo de pantalla según el estado
```

- `core/game.ts` contiene el reductor de una partida (`pickTile`, `tapSlot`, `check`,
  `confirmSkip`, `dismissFeedback`…).
- `app/reducer.ts` gestiona la navegación entre pantallas y delega las acciones de partida en
  el reductor del núcleo.
- `app/controller.ts` reconcilia los temporizadores con el estado: la cuenta atrás, el reloj,
  el cierre del feedback (acierto, error, respuesta revelada) y la confirmación del salto.

## Decisiones importantes

### El cronómetro usa la hora real, no cuenta ticks

El tiempo se calcula como `ahora − inicio`. Los navegadores frenan o pausan los temporizadores
cuando la pantalla se bloquea; contar ticks falsearía los tiempos en una carrera. El reloj
solo repinta cada 250 ms.

### El código de lista es una semilla

`AN6H9` = 4 símbolos de semilla (20 bits) + 1 símbolo de control.

- La semilla alimenta un generador pseudoaleatorio determinista (`core/random.ts`,
  mulberry32). Con el mismo código y el mismo banco, `buildGameWords` devuelve siempre las
  mismas 10 palabras, en el mismo orden y con las sílabas en la misma disposición, en
  cualquier dispositivo.
- El símbolo de control depende de la semilla **y de la versión del banco**. Detecta errores
  de tipeo (con pesos impares, cualquier error de un símbolo se detecta) y códigos de otra
  versión del banco.
- Alfabeto Crockford base32 (sin I, L, O, U), para dictar códigos sin confusiones.

### El banco está versionado

Cambiar el banco cambia qué lista produce cada código. `BANK_VERSION` forma parte del código y
`tests/bank-version.test.ts` compara una huella del contenido del banco: si el banco cambia y
la versión no, el test falla.

### Reglas como datos y funciones puras

Las penalizaciones están en `core/rules.ts` (`ERROR_PENALTIES_SECONDS`,
`SKIP_PENALTY_SECONDS`). Cambiar una regla es cambiar una constante, y los tests la cubren.

### Interfaz declarativa con `lit-html`

Se dibuja la pantalla completa en cada cambio de estado y `lit-html` actualiza solo los nodos
que cambiaron. Esto conserva el foco del teclado y es lo bastante rápido para repintar el reloj
cuatro veces por segundo. Se evita `innerHTML` con texto dinámico.

### PWA

`vite-plugin-pwa` genera el manifiesto y un _service worker_ que guarda todos los recursos
(incluida la tipografía, empaquetada con `@fontsource`, sin pedir nada a internet). Las rutas
son relativas (`base: './'`) para que funcione en un subdirectorio, como en GitHub Pages.

## Pruebas

| Nivel             | Dónde                      | Qué cubre                                                       |
| ----------------- | -------------------------- | --------------------------------------------------------------- |
| Unitarias         | `tests/*.test.ts`          | reglas, código, lista, reductor de partida y de la app          |
| Interfaz          | `tests/ui.test.ts` (jsdom) | pantallas y su cableado con el estado                           |
| Humo en navegador | `e2e/smoke.mjs`            | partida completa, penalizaciones, salto, rotación, sin conexión |
| Datos             | `tools/bank_tools.py`      | solución única de cada caso del banco                           |

## Cómo extender

- **Cambiar una regla de penalización:** `core/rules.ts` y sus tests.
- **Agregar palabras:** `tools/bank_tools.py suggest`, revisar, pegar en `bank.json`, validar,
  subir `BANK_VERSION` y registrar la huella.
- **Agregar una pantalla:** una función en `ui/screens/`, un valor en `Screen`
  (`app/state.ts`) y su caso en `ui/view.ts`.
- **Partidas en vivo entre amigos:** requeriría un servidor (por ejemplo, un servicio de
  tiempo real). El núcleo no cambiaría; haría falta una capa nueva que envíe y reciba el
  progreso, y que el servidor sea quien entregue las palabras si se quiere proteger el banco.
