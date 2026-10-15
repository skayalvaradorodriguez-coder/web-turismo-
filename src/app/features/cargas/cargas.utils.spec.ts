import { describe, expect, it } from 'vitest';
import { etiquetaEstadoCarga, formatearFecha, formatearPeriodo } from './cargas.utils';

describe('formatearFecha', () => {
  it('escribe el mes abreviado', () => {
    expect(formatearFecha('2025-01-31')).toBe('31 ene 2025');
  });

  it('quita el cero del dia', () => {
    expect(formatearFecha('2025-03-05')).toBe('5 mar 2025');
  });

  it('si el texto no es una fecha lo devuelve igual', () => {
    expect(formatearFecha('no-es-fecha')).toBe('no-es-fecha');
  });
});

describe('formatearPeriodo', () => {
  it('con inicio y fin muestra el rango', () => {
    expect(formatearPeriodo('2025-01-01', '2025-03-31')).toBe('1 ene 2025 – 31 mar 2025');
  });

  it('si inicio y fin son el mismo dia muestra una sola fecha', () => {
    expect(formatearPeriodo('2025-02-10', '2025-02-10')).toBe('10 feb 2025');
  });

  it('solo con inicio', () => {
    expect(formatearPeriodo('2025-01-01', null)).toBe('Desde 1 ene 2025');
  });

  it('solo con fin', () => {
    expect(formatearPeriodo(null, '2025-03-31')).toBe('Hasta 31 mar 2025');
  });

  it('sin fechas avisa que no hay periodo', () => {
    expect(formatearPeriodo(null, null)).toBe('Sin período');
  });
});

describe('etiquetaEstadoCarga', () => {
  it('devuelve el texto para la persona', () => {
    expect(etiquetaEstadoCarga('rechazada')).toBe('Rechazada');
  });
});