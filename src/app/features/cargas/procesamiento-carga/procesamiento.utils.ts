import type {
  EstadoProcesamiento,
  ResultadoProcesamiento,
  TipoProcesamiento,
} from '@app/core/models/procesamiento.models';

/** Codigo de la fuente que hoy tiene procesador (el mismo que usa la API). */
export const CODIGO_FUENTE_CATASTRO = 'catastro_turistico';

export function etiquetaTipoProcesamiento(tipo: TipoProcesamiento): string {
  return tipo === 'validacion' ? 'Validación' : 'Procesamiento';
}

export function etiquetaEstadoProcesamiento(estado: EstadoProcesamiento): string {
  const etiquetas: Record<EstadoProcesamiento, string> = {
    en_curso: 'En curso',
    completado: 'Completado',
    fallido: 'Fallido',
  };
  return etiquetas[estado];
}

/** "1 error" / "2 errores" / "0 errores". */
export function textoConteo(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? ''
    : fecha.toLocaleString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Frase corta que cuenta que paso al validar o procesar. */
export function resumenResultado(resultado: ResultadoProcesamiento): string {
  const p = resultado.procesamiento;
  if (p.estado === 'fallido') {
    const que = p.tipo === 'validacion' ? 'la validación' : 'el procesamiento';
    return `No se pudo completar ${que}: ${p.mensajeError ?? 'error desconocido'}.`;
  }

  const filas = textoConteo(p.totalFilas, 'fila revisada', 'filas revisadas');
  const alertas = textoConteo(p.totalAlertas, 'alerta', 'alertas');

  if (p.tipo === 'procesamiento') return `Carga procesada: ${filas} y ${alertas}.`;
  if (p.totalErrores > 0) {
    return `La validación encontró ${textoConteo(p.totalErrores, 'error', 'errores')} y ${alertas}. La carga no avanzó.`;
  }
  return `Validación completada: ${filas} y ${alertas}. Ya puedes procesar la carga.`;
}