import { describe, expect, it } from 'vitest';
import { esArchivoPermitido, etiquetaEstadoCarga, etiquetaNivelIngreso, extensionDe, formatearFecha, formatearPeriodo, formatearTamano } from './cargas.utils';

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

describe('etiquetaNivelIngreso', () => {
  it('muestra el nombre del nivel', () => {
    expect(etiquetaNivelIngreso(1)).toBe('Nivel 1 · Guardada y catalogada');
    expect(etiquetaNivelIngreso(3)).toBe('Nivel 3 · Integrada');
  });

  it('un nivel desconocido muestra solo el numero', () => {
    expect(etiquetaNivelIngreso(9)).toBe('Nivel 9');
  });
});

describe('extensionDe y esArchivoPermitido', () => {
  it('toma la ultima extension en minusculas', () => {
    expect(extensionDe('Datos.CSV')).toBe('csv');
    expect(extensionDe('informe.final.pdf')).toBe('pdf');
  });

  it('sin extension valida devuelve null', () => {
    expect(extensionDe('sin_extension')).toBeNull();
    expect(extensionDe('.oculto')).toBeNull();
    expect(extensionDe('termina.')).toBeNull();
  });

  it('acepta solo los formatos permitidos', () => {
    expect(esArchivoPermitido('catastro.csv')).toBe(true);
    expect(esArchivoPermitido('foto.JPG')).toBe(true);
    expect(esArchivoPermitido('programa.exe')).toBe(false);
  });
});

describe('formatearTamano', () => {
  it('usa bytes, KB y MB', () => {
    expect(formatearTamano(500)).toBe('500 B');
    expect(formatearTamano(2048)).toBe('2,0 KB');
    expect(formatearTamano(5 * 1024 * 1024)).toBe('5,0 MB');
  });
});