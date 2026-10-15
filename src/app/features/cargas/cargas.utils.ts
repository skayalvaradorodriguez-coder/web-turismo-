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

/** Hasta donde ha llegado el dato: 1 guardada y catalogada, 2 procesada, 3 integrada. */
const NIVELES_INGRESO: Record<number, string> = {
  1: 'Guardada y catalogada',
  2: 'Procesada',
  3: 'Integrada',
};

export function etiquetaNivelIngreso(nivel: number): string {
  const nombre = NIVELES_INGRESO[nivel];
  return nombre ? `Nivel ${nivel} · ${nombre}` : `Nivel ${nivel}`;
}

/** Formatos que acepta la API (ella vuelve a revisar el contenido real del archivo). */
export const EXTENSIONES_PERMITIDAS = ['csv', 'txt', 'json', 'xlsx', 'xls', 'pdf', 'png', 'jpg', 'jpeg'] as const;

/** Ultima extension en minusculas, o null si el nombre no tiene una. */
export function extensionDe(nombre: string): string | null {
  const punto = nombre.lastIndexOf('.');
  if (punto <= 0 || punto === nombre.length - 1) return null;
  return nombre.slice(punto + 1).toLowerCase();
}

export function esArchivoPermitido(nombre: string): boolean {
  const extension = extensionDe(nombre);
  return extension !== null && (EXTENSIONES_PERMITIDAS as readonly string[]).includes(extension);
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}