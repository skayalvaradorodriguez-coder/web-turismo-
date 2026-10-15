import type { EstadoCarga } from '@app/core/models/carga.models';

/** Estados en el orden del flujo, con el texto que ve la persona. */
export const ESTADOS_CARGA: readonly { valor: EstadoCarga; etiqueta: string }[] = [
  { valor: 'recibida', etiqueta: 'Recibida' },
  { valor: 'validada', etiqueta: 'Validada' },
  { valor: 'procesada', etiqueta: 'Procesada' },
  { valor: 'publicada', etiqueta: 'Publicada' },
  { valor: 'rechazada', etiqueta: 'Rechazada' },
];

export function etiquetaEstadoCarga(estado: EstadoCarga): string {
  return ESTADOS_CARGA.find((e) => e.valor === estado)?.etiqueta ?? estado;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2025-01-31" -> "31 ene 2025". Se arma a mano para que no cambie por la zona horaria. */
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  const nombreMes = MESES[Number(mes) - 1];
  if (!anio || !dia || !nombreMes) return fecha;
  return `${Number(dia)} ${nombreMes} ${anio}`;
}

export function formatearPeriodo(desde: string | null, hasta: string | null): string {
  if (desde && hasta) {
    return desde === hasta ? formatearFecha(desde) : `${formatearFecha(desde)} – ${formatearFecha(hasta)}`;
  }
  if (desde) return `Desde ${formatearFecha(desde)}`;
  if (hasta) return `Hasta ${formatearFecha(hasta)}`;
  return 'Sin período';
}