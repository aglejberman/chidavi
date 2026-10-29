#!/usr/bin/env python3
"""Herramientas para mantener el banco de palabras de Chidavi.

Subcomandos:
  validate  Comprueba que cada entrada de src/data/bank.json tenga UNA sola solución:
            entre las ordenaciones de 3 de las 4 sílabas mostradas, solo la palabra
            esperada debe existir en español.
  suggest   Propone un distractor con solución única para cada palabra silabeada de un
            archivo de candidatas (una por línea, p. ej. "ca-be-za") y escribe entradas
            listas para revisar y pegar en el banco.

La existencia de una palabra se decide con la lista de frecuencias de `wordfreq`. No es
un diccionario oficial: los casos dudosos deben revisarse a mano.

Uso:
  pip install -r tools/requirements.txt
  python tools/bank_tools.py validate
  python tools/bank_tools.py suggest tools/candidates.txt --start-id 101
"""

from __future__ import annotations

import argparse
import itertools
import json
import random
import sys
import unicodedata
from pathlib import Path

from wordfreq import zipf_frequency

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BANK = ROOT / "src" / "data" / "bank.json"

# Una cadena de sílabas cuenta como "palabra existente" si su frecuencia (escala zipf)
# alcanza este umbral. Es deliberadamente bajo: preferimos descartar casos de más.
EXISTENCE_THRESHOLD = 1.0

# Sílabas simples candidatas a distractor.
DISTRACTOR_POOL = (
    "la le li lo lu ra re ri ro ru sa se si so su ta te ti to tu na ne ni no nu ma me mi "
    "mo mu pa pe pi po pu ca co cu da de di do du fa fe fi fo ga gu ba be bi bo bu va ve vi "
    "vo ja ju za ce ci zo mar pan sol tor can ver los las con par"
).split()


def exists(text: str) -> bool:
    return zipf_frequency(text, "es") >= EXISTENCE_THRESHOLD


def valid_words(tiles: list[str]) -> set[str]:
    """Palabras existentes que se pueden formar con 3 de las fichas, en cualquier orden."""
    return {
        word
        for perm in itertools.permutations(tiles, 3)
        if exists(word := "".join(perm))
    }


def has_unique_solution(syllables: list[str], distractor: str, word: str) -> bool:
    return valid_words([*syllables, distractor]) == {word}


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    return "".join(c for c in normalized if unicodedata.category(c) != "Mn")


def cmd_validate(args: argparse.Namespace) -> int:
    bank = json.loads(Path(args.bank).read_text(encoding="utf-8"))
    problems: list[str] = []
    for entry in bank:
        word, syllables, distractor = entry["word"], entry["syllables"], entry["distractor"]
        if "".join(syllables) != word:
            problems.append(f"#{entry['id']} {word}: las sílabas no forman la palabra")
            continue
        if not exists(word):
            problems.append(f"#{entry['id']} {word}: palabra poco frecuente o inexistente")
        found = valid_words([*syllables, distractor])
        if found != {word}:
            extra = ", ".join(sorted(found - {word})) or "ninguna"
            problems.append(f"#{entry['id']} {word}: otras soluciones posibles: {extra}")
    if problems:
        print("\n".join(problems))
        print(f"\n{len(problems)} problemas en {len(bank)} entradas")
        return 1
    print(f"OK: {len(bank)} entradas, todas con solución única")
    return 0


def cmd_suggest(args: argparse.Namespace) -> int:
    rng = random.Random(args.seed)
    lines = Path(args.candidates).read_text(encoding="utf-8").split()
    next_id = args.start_id
    accepted, rejected = [], []
    for line in lines:
        syllables = line.strip().split("-")
        word = "".join(syllables)
        if len(syllables) != 3:
            rejected.append((line, "debe tener 3 sílabas"))
            continue
        if not exists(word):
            rejected.append((line, "palabra poco frecuente o inexistente"))
            continue
        pool = [d for d in DISTRACTOR_POOL if d not in syllables]
        rng.shuffle(pool)
        distractor = next((d for d in pool if has_unique_solution(syllables, d, word)), None)
        if distractor is None:
            rejected.append((line, "ningún distractor da solución única"))
            continue
        accepted.append(
            {"id": next_id, "word": word, "syllables": syllables, "distractor": distractor}
        )
        next_id += 1

    output = json.dumps(accepted, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(output + "\n", encoding="utf-8")
    else:
        print(output)
    for line, reason in rejected:
        print(f"descartada {line}: {reason}", file=sys.stderr)
    print(f"{len(accepted)} propuestas, {len(rejected)} descartadas", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate", help="valida la solución única de cada entrada")
    validate.add_argument("--bank", default=str(DEFAULT_BANK))
    validate.set_defaults(func=cmd_validate)

    suggest = sub.add_parser("suggest", help="propone distractores para palabras nuevas")
    suggest.add_argument("candidates", help="archivo con una palabra silabeada por línea")
    suggest.add_argument("--start-id", type=int, required=True)
    suggest.add_argument("--seed", type=int, default=7)
    suggest.add_argument("--output", help="archivo de salida (por defecto, la pantalla)")
    suggest.set_defaults(func=cmd_suggest)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
