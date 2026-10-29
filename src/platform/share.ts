/** Copia texto al portapapeles. Devuelve `false` si el navegador no lo permite. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre el menú de compartir del sistema, si existe.
 * Devuelve `false` cuando no está disponible o el jugador lo cancela.
 */
export async function shareText(title: string, text: string): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}
