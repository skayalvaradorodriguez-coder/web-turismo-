import { describe, expect, it } from 'vitest';
import { etiquetaSeveridad, nombreRegla, ubicacionHallazgo, valorVisible } from './hallazgos.utils';

describe('hallazgos.utils', () => {
  it('nombra la severidad', () => {
    expect(etiquetaSeveridad('error')).toBe('Error');
    expect(etiquetaSeveridad('alerta')).toBe('Alerta');
  });

  it('nombreRegla cambia los guiones bajos por espacios', () => {
    expect(nombreRegla('provincia_distinta_de_santa_elena')).toBe('provincia distinta de santa elena');
    expect(nombreRegla('duplicado')).toBe('duplicado');
  });

  it('ubicacionHallazgo dice fila y columna, solo la fila, o el archivo completo', () => {
    expect(ubicacionHallazgo({ fila: 12, columna: 'Provincia' })).toBe('Fila 12 · Provincia');
    expect(ubicacionHallazgo({ fila: 12, columna: null })).toBe('Fila 12');
    expect(ubicacionHallazgo({ fila: null, columna: null })).toBe('Archivo completo');
  });

  it('valorVisible muestra (vacío) para una cadena vacía y deja el resto igual', () => {
    expect(valorVisible('')).toBe('(vacío)');
    expect(valorVisible('GUAYAS')).toBe('GUAYAS');
  });
});