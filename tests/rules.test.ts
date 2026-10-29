import { describe, expect, it } from 'vitest';
import { formatClock } from '../src/core/format';
import { errorPenaltySeconds, totalTimeMs } from '../src/core/rules';

describe('errorPenaltySeconds', () => {
  it('sube con cada error: 5, 10 y 20 segundos', () => {
    expect(errorPenaltySeconds(1)).toBe(5);
    expect(errorPenaltySeconds(2)).toBe(10);
    expect(errorPenaltySeconds(3)).toBe(20);
  });

  it('desde el cuarto error ya no penaliza', () => {
    expect(errorPenaltySeconds(4)).toBe(0);
    expect(errorPenaltySeconds(25)).toBe(0);
  });

  it('rechaza números de error inválidos', () => {
    expect(() => errorPenaltySeconds(0)).toThrow(RangeError);
    expect(() => errorPenaltySeconds(1.5)).toThrow(RangeError);
  });
});

describe('totalTimeMs', () => {
  it('suma las penalizaciones al tiempo real', () => {
    expect(totalTimeMs(12_000, 35)).toBe(47_000);
  });

  it('nunca usa un tiempo real negativo', () => {
    expect(totalTimeMs(-500, 5)).toBe(5_000);
  });
});

describe('formatClock', () => {
  it('formatea mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(59_999)).toBe('00:59');
    expect(formatClock(61_000)).toBe('01:01');
    expect(formatClock(3_725_000)).toBe('62:05');
  });

  it('trata los valores negativos como cero', () => {
    expect(formatClock(-1)).toBe('00:00');
  });
});
