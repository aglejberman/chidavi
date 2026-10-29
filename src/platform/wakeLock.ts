/**
 * Mantiene la pantalla encendida mientras se juega (Screen Wake Lock API).
 * Si el navegador no la soporta, no hace nada.
 */
export class ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null;

  async acquire(): Promise<void> {
    if (this.sentinel || !('wakeLock' in navigator)) return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });
    } catch {
      // Puede rechazarse (ahorro de batería, pestaña oculta): el juego sigue igual.
      this.sentinel = null;
    }
  }

  async release(): Promise<void> {
    const sentinel = this.sentinel;
    this.sentinel = null;
    await sentinel?.release();
  }
}
