import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EstadoCarga } from '@app/core/models/carga.models';
import type { Procesamiento, ResultadoProcesamiento } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from '@app/core/services/procesamiento.service';
import { ProcesamientoCargaComponent } from './procesamiento-carga.component';

const ejecucion = (cambios: Partial<Procesamiento> = {}): Procesamiento => ({
  id: 1, cargaId: 10, archivoId: 55, tipo: 'validacion', estado: 'completado', totalFilas: 2, totalErrores: 0,
  totalAlertas: 1, mensajeError: null, ejecutadoPor: 7, iniciadoEn: '2026-10-20T10:00:00.000Z',
  finalizadoEn: '2026-10-20T10:00:01.000Z', ...cambios,
});

const resultadoDe = (cambios: Partial<Procesamiento> = {}): ResultadoProcesamiento => ({
  procesamiento: ejecucion(cambios),
  resumen: [],
  estadoCarga: 'validada',
});

describe('ProcesamientoCargaComponent', () => {
  const api = { listar: vi.fn(), validar: vi.fn(), procesar: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    api.listar.mockReturnValue(of([]));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesamientoService, useValue: api }] });
  });

  function crear(estado: EstadoCarga, opciones: { gestion?: boolean; disponible?: boolean } = {}) {
    const fixture = TestBed.createComponent(ProcesamientoCargaComponent);
    fixture.componentRef.setInput('cargaId', 10);
    fixture.componentRef.setInput('estado', estado);
    fixture.componentRef.setInput('esGestion', opciones.gestion ?? true);
    fixture.componentRef.setInput('disponible', opciones.disponible ?? true);
    fixture.detectChanges();
    return fixture;
  }

  const botones = (f: ComponentFixture<unknown>): HTMLButtonElement[] =>
    Array.from((f.nativeElement as HTMLElement).querySelectorAll('button'));
  const textos = (f: ComponentFixture<unknown>): string[] => botones(f).map((b) => b.textContent?.trim() ?? '');
  const boton = (f: ComponentFixture<unknown>, texto: string) => botones(f).find((b) => b.textContent?.trim() === texto);
  const contenido = (f: ComponentFixture<unknown>): string => (f.nativeElement as HTMLElement).textContent ?? '';

  it('si la fuente no tiene procesamiento, avisa y no consulta nada ni muestra botones', () => {
    const f = crear('recibida', { disponible: false });

    expect(api.listar).not.toHaveBeenCalled();
    expect(textos(f)).toEqual([]);
    expect(contenido(f)).toContain('todavía no tiene un procesamiento disponible');
  });

  it('carga recibida: gestión ve Validar y no Procesar', () => {
    expect(textos(crear('recibida'))).toEqual(['Validar']);
  });

  it('carga validada: ofrece Validar de nuevo y Procesar', () => {
    expect(textos(crear('validada'))).toEqual(['Validar de nuevo', 'Procesar']);
  });

  it('carga procesada: sin botones y con el historial a la vista', () => {
    api.listar.mockReturnValue(of([ejecucion()]));
    const f = crear('procesada');

    expect(textos(f)).toEqual([]);
    expect(contenido(f)).toContain('Validación');
    expect(contenido(f)).toContain('2 filas');
  });

  it('quien no es de gestión no ve botones', () => {
    expect(textos(crear('validada', { gestion: false }))).toEqual([]);
  });

  it('validar llama a la API, muestra el resultado y avisa al detalle', () => {
    api.validar.mockReturnValue(of(resultadoDe()));
    const f = crear('recibida');
    const avisos = vi.fn();
    f.componentInstance.cambio.subscribe(avisos);

    boton(f, 'Validar')?.click();
    f.detectChanges();

    expect(api.validar).toHaveBeenCalledWith(10);
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(contenido(f)).toContain('Validación completada');
  });

  it('procesar pide confirmar antes de llamar a la API', () => {
    api.procesar.mockReturnValue(of(resultadoDe({ tipo: 'procesamiento' })));
    const f = crear('validada');
    const avisos = vi.fn();
    f.componentInstance.cambio.subscribe(avisos);

    boton(f, 'Procesar')?.click();
    f.detectChanges();
    expect(api.procesar).not.toHaveBeenCalled();
    expect(textos(f)).toEqual(['Sí, procesar', 'Cancelar']);

    boton(f, 'Sí, procesar')?.click();
    f.detectChanges();
    expect(api.procesar).toHaveBeenCalledWith(10);
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(contenido(f)).toContain('Carga procesada');
  });

  it('cancelar la confirmación vuelve a los botones sin llamar a la API', () => {
    const f = crear('validada');

    boton(f, 'Procesar')?.click();
    f.detectChanges();
    boton(f, 'Cancelar')?.click();
    f.detectChanges();

    expect(api.procesar).not.toHaveBeenCalled();
    expect(textos(f)).toEqual(['Validar de nuevo', 'Procesar']);
  });

  it('si la API responde con error, muestra su mensaje y no avisa al detalle', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { ok: false, code: 'VALIDACION_DESACTUALIZADA', message: 'La validacion esta desactualizada' },
    });
    api.validar.mockReturnValue(throwError(() => error));
    const f = crear('validada');
    const avisos = vi.fn();
    f.componentInstance.cambio.subscribe(avisos);

    boton(f, 'Validar de nuevo')?.click();
    f.detectChanges();

    expect(contenido(f)).toContain('La validacion esta desactualizada');
    expect(avisos).not.toHaveBeenCalled();
  });
});