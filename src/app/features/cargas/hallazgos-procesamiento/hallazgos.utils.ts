import type { Hallazgo, SeveridadHallazgo } from '@app/core/models/procesamiento.models';

export function etiquetaSeveridad(severidad: SeveridadHallazgo): string {
  return severidad === 'error' ? 'Error' : 'Alerta';
}

/** "provincia_distinta" -> "provincia distinta". */
export function nombreRegla(regla: string): string {
  return regla.replace(/_/g, ' ');
}

/** Donde esta el problema: fila y columna, o el archivo completo si no hay fila. */
export function ubicacionHallazgo(hallazgo: Pick<Hallazgo, 'fila' | 'columna'>): string {
  if (hallazgo.fila === null) return 'Archivo completo';
  return hallazgo.columna ? `Fila ${hallazgo.fila} · ${hallazgo.columna}` : `Fila ${hallazgo.fila}`;
}

/** Una celda vacia tambien es un valor: se muestra como "(vacío)" para que no parezca que falta. */
export function valorVisible(valor: string): string {
  return valor === '' ? '(vacío)' : valor;
}