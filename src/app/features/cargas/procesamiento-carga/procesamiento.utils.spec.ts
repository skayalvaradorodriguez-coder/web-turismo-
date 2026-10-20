import { describe, expect, it } from 'vitest';
import type { Procesamiento, ResultadoProcesamiento } from '@app/core/models/procesamiento.models';
import {
  etiquetaEstadoProcesamiento,
  etiquetaTipoProcesamiento,
  formatearFechaHora,
  resumenResultado,
  textoConteo,
} from './procesamiento.utils';

const resultado = (cambios: Partial<Procesamiento> = {}): ResultadoProcesamiento => ({
  procesamiento: {
    id: 91, cargaId: 10, archivoId: 55, tipo: 'validacion', estado: 'completado', totalFilas: 2, totalErrores: 0,
    totalAlertas: 1, mensajeError: null, ejecutadoPor: 7, iniciadoEn: '2026-10-20T10:00:00.000Z',
    finalizadoEn: '2026-10-20T10:00:01.000Z', ...cambios,
  },
  resumen: [],
  estadoCarga: 'validada',
});

describe('procesamiento.utils', () => {
  it('nombra el tipo y el estado de cada ejecución', () => {
    expect(etiquetaTipoProcesamiento('validacion')).toBe('Validación');
    expect(etiquetaTipoProcesamiento('procesamiento')).toBe('Procesamiento');
    expect(etiquetaEstadoProcesamiento('en_curso')).toBe('En curso');
    expect(etiquetaEstadoProcesamiento('completado')).toBe('Completado');
    expect(etiquetaEstadoProcesamiento('fallido')).toBe('Fallido');
  });

  it('textoConteo usa singular solo para 1', () => {
    expect(textoConteo(1, 'error', 'errores')).toBe('1 error');
    expect(textoConteo(0, 'error', 'errores')).toBe('0 errores');
    expect(textoConteo(2, 'error', 'errores')).toBe('2 errores');
  });

  it('formatearFechaHora devuelve vacío si la fecha no es válida', () => {
    expect(formatearFechaHora('no es fecha')).toBe('');
    expect(formatearFechaHora('2026-10-20T10:00:00.000Z')).toContain('2026');
  });

  it('resume una validación sin errores e invita a procesar', () => {
    expect(resumenResultado(resultado())).toBe('Validación completada: 2 filas revisadas y 1 alerta. Ya puedes procesar la carga.');
  });

  it('resume una validación con errores diciendo que la carga no avanzó', () => {
    expect(resumenResultado(resultado({ totalErrores: 1, totalAlertas: 0 }))).toBe(
      'La validación encontró 1 error y 0 alertas. La carga no avanzó.',
    );
  });

  it('resume un procesamiento completado', () => {
    expect(resumenResultado(resultado({ tipo: 'procesamiento', totalFilas: 1 }))).toBe('Carga procesada: 1 fila revisada y 1 alerta.');
  });

  it('cuenta el motivo cuando la ejecución falló', () => {
    expect(resumenResultado(resultado({ estado: 'fallido', mensajeError: 'se cayó la base' }))).toBe(
      'No se pudo completar la validación: se cayó la base.',
    );
    expect(resumenResultado(resultado({ tipo: 'procesamiento', estado: 'fallido' }))).toBe(
      'No se pudo completar el procesamiento: error desconocido.',
    );
  });
});