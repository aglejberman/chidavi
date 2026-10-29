# Reglas de Chidavi

## Objetivo

Descubrir las **10 palabras** de una lista en el menor tiempo posible.

## Una palabra

Se muestran cuatro sílabas. **Tres forman la palabra y una sobra** (la distractora). Hay que
colocar las tres correctas, en orden, en las tres casillas y pulsar _Comprobar_.

Cada caso del banco tiene una única solución válida.

## Tiempo y penalizaciones

El tiempo final es el tiempo real de juego más las penalizaciones. Gana quien tiene el menor
tiempo final.

| Evento                                | Penalización     |
| ------------------------------------- | ---------------- |
| 1.er error en una palabra             | +5 s             |
| 2.º error en la misma palabra         | +10 s            |
| 3.er error en la misma palabra        | +20 s            |
| 4.º error y siguientes en esa palabra | sin penalización |
| Saltar una palabra                    | +35 s            |

- El contador de errores **se reinicia en cada palabra**.
- **Saltar** pide confirmación (el botón cambia a «¿Seguro? +35 s» y se desarma solo a los 3
  segundos). Al confirmar se muestra la respuesta unos segundos y la palabra cuenta como
  hecha; no se puede volver a ella.

## Ayudas de manejo

- **Rotar sílabas:** cambia de lugar las cuatro sílabas disponibles (giro circular) para
  verlas desde otro ángulo. No tiene costo ni cambia la respuesta.
- **Reacomodar:** tocar una casilla ocupada la selecciona; tocar otra casilla ocupada
  intercambia ambas sílabas, y tocar una vacía mueve la sílaba allí. Tocar dos veces la misma
  casilla devuelve la sílaba a las disponibles.
- **Borrar:** vacía las tres casillas de una vez.

## Jugar entre amigos

Cada lista tiene un **código de 5 caracteres** (por ejemplo `AN6H9`). Con el mismo código,
cualquier teléfono elige las mismas 10 palabras, en el mismo orden y con las sílabas en la
misma disposición. No hace falta servidor.

1. Uno crea la lista y comparte el código (o cada uno carga el de un amigo).
2. Todos tocan _Empezar_ al mismo tiempo; hay una cuenta atrás de 3 segundos.
3. Al terminar, comparan el tiempo final.

El quinto carácter del código es de control: detecta errores al escribirlo y códigos de
otra versión del banco de palabras.
