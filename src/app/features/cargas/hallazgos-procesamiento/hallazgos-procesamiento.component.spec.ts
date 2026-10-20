import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hallazgo, PaginaHallazgos } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from '@app/core/services/procesamiento.service';
import { HallazgosProcesamientoComponent } from './hallazgos-procesamiento.component';

const hallazgo = (cambios: Partial<Hallazgo> = {}): Hallazgo => ({
  id: 1, procesamientoId: 91, fila: 12, columna: 'Provincia', regla: 'provincia_fuera_de_santa_elena', severidad: 'error',
  mensaje: 'La provincia no es Santa Elena', valorOriginal: 'GUAYAS', valorCorregido: null, ...cambios,
});

const pagina = (cambios: Partial<PaginaHallazgos> = {}): PaginaHallazgos => ({
  hallazgos: [hallazgo()], total: 1, pagina: 1, limite: 25,
  resumen: [{ regla: 'provincia_fuera_de_santa_elena', severidad: 'error', total: 1 }], ...cambios,
});

describe('HallazgosProcesamientoComponent', () => {
  const api = { hallazgos: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    api.hallazgos.mockReturnValue(of(pagina()));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesamientoService, useValue: api }] });
  });

  function crear() {
    const fixture = TestBed.createComponent(HallazgosProcesamientoComponent);
    fixture.componentRef.setInput('cargaId', 10);
    fixture.componentRef.setInput('procesamientoId', 91);
    fixture.detectChanges();
    return fixture;
  }

  const contenido = (f: ComponentFixture<unknown>): string => (f.nativeElement as HTMLElement).textContent ?? '';
  const boton = (f: ComponentFixture<unknown>, texto: string) =>
    Array.from((f.nativeElement as HTMLElement).querySelectorAll('button')).find((b) => b.textContent?.trim() === texto);

  it('pide la primera página, de 25 en 25 y sin filtro', () => {
    crear();

    expect(api.hallazgos).toHaveBeenCalledTimes(1);
    expect(api.hallazgos).toHaveBeenCalledWith(10, 91, expect.objectContaining({ pagina: 1, limite: 25 }));
    expect(api.hallazgos.mock.calls[0]?.[2]?.severidad).toBeUndefined();
  });

  it('muestra el lugar, el mensaje, el valor original y el resumen por regla', () => {
    const f = crear();

    expect(contenido(f)).toContain('Fila 12 · Provincia');
    expect(contenido(f)).toContain('La provincia no es Santa Elena');
    expect(contenido(f)).toContain('GUAYAS');
    expect(contenido(f)).toContain('provincia fuera de santa elena');
  });

  it('un hallazgo del archivo completo no inventa fila y una celda vacía se ve como (vacío)', () => {
    api.hallazgos.mockReturnValue(of(pagina({ hallazgos: [hallazgo({ fila: null, columna: null, valorOriginal: '' })] })));
    const f = crear();

    expect(contenido(f)).toContain('Archivo completo');
    expect(contenido(f)).toContain('(vacío)');
  });

  it('filtrar por Errores vuelve a pedir la página 1 con esa severidad', () => {
    const f = crear();

    boton(f, 'Errores')?.click();
    f.detectChanges();

    expect(api.hallazgos).toHaveBeenCalledTimes(2);
    expect(api.hallazgos).toHaveBeenLastCalledWith(10, 91, expect.objectContaining({ severidad: 'error', pagina: 1 }));
    expect(boton(f, 'Errores')?.getAttribute('aria-pressed')).toBe('true');
    expect(boton(f, 'Todos')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('con más de 25 hallazgos pagina: Anterior apagado en la primera y Siguiente pide la 2', () => {
    api.hallazgos.mockReturnValue(of(pagina({ total: 60 })));
    const f = crear();

    expect(contenido(f)).toContain('Página 1 de 3');
    expect(boton(f, 'Anterior')?.disabled).toBe(true);

    boton(f, 'Siguiente')?.click();
    f.detectChanges();

    expect(api.hallazgos).toHaveBeenLastCalledWith(10, 91, expect.objectContaining({ pagina: 2 }));
    expect(contenido(f)).toContain('Página 2 de 3');
  });

  it('sin hallazgos para el filtro lo dice', () => {
    api.hallazgos.mockReturnValue(of(pagina({ hallazgos: [], total: 0, resumen: [] })));

    expect(contenido(crear())).toContain('No hay hallazgos con este filtro.');
  });

  it('si la API responde con error, muestra su mensaje', () => {
    const error = new HttpErrorResponse({ status: 404, error: { ok: false, code: 'NO_EXISTE', message: 'El procesamiento no existe' } });
    api.hallazgos.mockReturnValue(throwError(() => error));

    expect(contenido(crear())).toContain('El procesamiento no existe');
  });
});