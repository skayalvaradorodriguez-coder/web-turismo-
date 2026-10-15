import { HttpErrorResponse } from '@angular/common/http';

/** Texto para mostrar al usuario a partir de un error al hablar con la API. */
export function mensajeErrorApi(error: unknown, porDefecto: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
    const mensaje = (error.error as { message?: unknown } | null)?.message;
    if (typeof mensaje === 'string' && mensaje.trim()) return mensaje;
  }
  return porDefecto;
}