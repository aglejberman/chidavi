import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BANK_VERSION } from '../src/core/bank';
import bankData from '../src/data/bank.json';

/**
 * Huella del contenido del banco para cada versión publicada.
 *
 * El código de lista depende de la versión del banco. Si el banco cambia (palabras,
 * sílabas u orden) y la versión no, dos jugadores con versiones distintas de la app
 * recibirían listas diferentes con el mismo código. Este test lo impide.
 *
 * Al cambiar el banco: suba BANK_VERSION en src/core/bank.ts y agregue aquí la huella nueva.
 */
const FINGERPRINTS: Readonly<Record<number, string>> = {
  1: 'b5324155da16f685',
};

function fingerprint(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

describe('versión del banco', () => {
  it('la huella del banco coincide con la de su versión', () => {
    expect(
      fingerprint(bankData),
      `El banco cambió: suba BANK_VERSION (actual: ${BANK_VERSION}) y registre la nueva huella.`,
    ).toBe(FINGERPRINTS[BANK_VERSION]);
  });
});
