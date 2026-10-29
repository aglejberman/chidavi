import type { WordCase } from './types';

/**
 * Versión del banco de palabras. Debe incrementarse cada vez que cambie el contenido
 * o el orden del banco: forma parte del código de lista y evita que dos teléfonos con
 * bancos distintos crean que juegan la misma lista.
 */
export const BANK_VERSION = 1;

export class BankValidationError extends Error {
  constructor(public readonly problems: readonly string[]) {
    super(`Banco de palabras inválido:\n- ${problems.join('\n- ')}`);
    this.name = 'BankValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Valida la estructura y la coherencia del banco. Lanza `BankValidationError` si falla. */
export function parseBank(raw: unknown): readonly WordCase[] {
  if (!Array.isArray(raw)) throw new BankValidationError(['el banco debe ser una lista']);

  const problems: string[] = [];
  const ids = new Set<number>();
  const words = new Set<string>();
  const cases: WordCase[] = [];

  raw.forEach((item: unknown, position) => {
    const label = `entrada ${position}`;
    if (!isRecord(item)) {
      problems.push(`${label}: no es un objeto`);
      return;
    }
    const { id, word, syllables, distractor } = item;

    if (typeof id !== 'number' || !Number.isInteger(id)) {
      problems.push(`${label}: id inválido`);
      return;
    }
    if (typeof word !== 'string' || word.length === 0) {
      problems.push(`${label}: palabra inválida`);
      return;
    }
    if (
      !Array.isArray(syllables) ||
      syllables.length !== 3 ||
      !syllables.every((s): s is string => typeof s === 'string' && s.length > 0)
    ) {
      problems.push(`${label} (${word}): debe tener exactamente 3 sílabas`);
      return;
    }
    if (typeof distractor !== 'string' || distractor.length === 0) {
      problems.push(`${label} (${word}): distractor inválido`);
      return;
    }

    if (syllables.join('') !== word) {
      problems.push(`${label} (${word}): las sílabas no forman la palabra`);
    }
    if (syllables.includes(distractor)) {
      problems.push(`${label} (${word}): el distractor repite una sílaba de la palabra`);
    }
    if (ids.has(id)) problems.push(`${label} (${word}): id duplicado (${id})`);
    if (words.has(word)) problems.push(`${label}: palabra duplicada (${word})`);
    ids.add(id);
    words.add(word);

    cases.push({
      id,
      word,
      syllables: [syllables[0] ?? '', syllables[1] ?? '', syllables[2] ?? ''],
      distractor,
    });
  });

  if (problems.length > 0) throw new BankValidationError(problems);
  return cases;
}
