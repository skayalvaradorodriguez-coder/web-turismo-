import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Carga, DetalleCarga, EstadoCarga } from '@app/core/models/carga.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargaDetallePage } from './carga-detalle.page';

const URL_CARGA = `${API_URL}/cargas/5`;
const URL_FUENTE = `${API_URL}/fuentes/1`;

const detalle = (estado: EstadoCarga = 'recibida', extra: Partial<Carga> = {}): DetalleCarga => ({
  carga: {
    id: 5, fuenteId: 1, estructuraId: null, descripcion: 'Prueba de carga', periodoDesde: '2026-10-15',
    periodoHasta: '2026-10-31', nivelIngreso: 1, estado, motivoRechazo: null, cargadoPor: 1, publicadaPor: null,
    publicadaEn: null, creadaEn: '2026-10-15T12:00:00.000Z', actualizadaEn: '2026-10-15T12:00:00.000Z', ...extra,
  },
  archivos: [
    {
      id: 3, cargaId: 5, nombreOriginal: 'prueba_carga.csv', nombreAlmacenado: 'x.csv', tipoMime: 'text/csv',
      tamanoBytes: 2048, sha256: 'abc123def456', version: 1, vigente: true, subidoPor: 1, creadoEn: '2026-10-15T12:00:00.000Z',
    },
  ],
  metadatos: [{ clave: 'cobertura', valor: 'Provincia' }],
});

function preparar(opciones: { rol?: string; id?: string } = {}) {
  const { rol = 'admin', id = '5' } = opciones;
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      { provide: AuthService, useValue: { usuario: () => ({ rol }) } },
    ],
  });
  const fixture = TestBed.createComponent(CargaDetallePage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  const raiz = fixture.nativeElement as HTMLElement;
  const texto = () => raiz.textContent ?? '';
  const boton = (etiqueta: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === etiqueta) as HTMLButtonElement | undefined;
  const responder = (cuerpo: DetalleCarga = detalle()) => {
    http.expectOne(URL_CARGA).flush({ ok: true, data: cuerpo });
    http.expectOne(URL_FUENTE).flush({ ok: true, data: { fuente: { id: 1, nombre: 'Fuente de prueba' } } });
    fixture.detectChanges();
  };
  return { fixture, http, raiz, texto, boton, responder, pagina: fixture.componentInstance };
}

describe('CargaDetallePage', () => {
  it('muestra "Cargando" mientras espera la API', () => {
    const { texto, http } = preparar();
    expect(texto()).toContain('Cargando carga');
    http.expectOne(URL_CARGA);
  });

  it('muestra el resumen, el archivo con su huella y los metadatos', () => {
    const { raiz, texto, responder } = preparar();
    responder();

    expect(texto()).toContain('Carga #5');
    expect(texto()).toContain('Fuente de prueba');
    expect(raiz.querySelector('.insignia')?.textContent?.trim()).toBe('Recibida');
    expect(texto()).toContain('15 oct 2026 – 31 oct 2026');
    expect(texto()).toContain('Nivel 1 · Guardada y catalogada');
    expect(texto()).toContain('prueba_carga.csv');
    expect(texto()).toContain('Vigente');
    expect(texto()).toContain('2,0 KB');
    expect(texto()).toContain('abc123def456');
    expect(texto()).toContain('cobertura');
    expect(texto()).toContain('Provincia');
  });

  it('si la carga no existe muestra el mensaje de la API', () => {
    const { fixture, http, texto } = preparar();
    http.expectOne(URL_CARGA).flush(
      { ok: false, code: 'CARGA_NO_ENCONTRADA', message: 'La carga no existe' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('La carga no existe');
  });

  it('con un id que no es un numero no llama a la API', () => {
    const { http, texto } = preparar({ id: 'abc' });
    http.expectNone(() => true);
    expect(texto()).toContain('La carga no existe');
  });

  it('Descargar pide el archivo y lo entrega al navegador', () => {
    const { fixture, http, boton, responder } = preparar();
    responder();

    const crear = vi.fn(() => 'blob:prueba');
    Object.defineProperty(URL, 'createObjectURL', { value: crear, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true });
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    boton('Descargar')?.click();
    fixture.detectChanges();

    const peticion = http.expectOne(`${URL_CARGA}/archivos/3/descarga`);
    expect(peticion.request.responseType).toBe('blob');
    peticion.flush(new Blob(['a,b']));

    expect(crear).toHaveBeenCalled();
    expect(clic).toHaveBeenCalled();
    clic.mockRestore();
  });

  it('si la descarga falla muestra el mensaje de la API', async () => {
    const { fixture, http, texto, boton, responder } = preparar();
    responder();

    boton('Descargar')?.click();
    fixture.detectChanges();
    http.expectOne(`${URL_CARGA}/archivos/3/descarga`).flush(
      new Blob([JSON.stringify({ ok: false, message: 'El archivo no esta disponible' })]),
      { status: 404, statusText: 'Not Found' },
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(texto()).toContain('El archivo no esta disponible');
    });
  });

  it('gestion ve "Rechazar carga" cuando esta recibida', () => {
    const { boton, responder } = preparar();
    responder(detalle('recibida'));
    expect(boton('Rechazar carga')).toBeTruthy();
  });

  it('no se ofrece rechazar una carga que ya paso de validada', () => {
    const { boton, responder } = preparar();
    responder(detalle('procesada'));
    expect(boton('Rechazar carga')).toBeUndefined();
  });

  it('el investigador solo consulta: no ve "Rechazar carga"', () => {
    const { boton, responder } = preparar({ rol: 'investigador' });
    responder(detalle('recibida'));
    expect(boton('Rechazar carga')).toBeUndefined();
  });

  it('rechazar sin un motivo valido no llama a la API', () => {
    const { fixture, http, texto, boton, responder, pagina } = preparar();
    responder();

    boton('Rechazar carga')?.click();
    fixture.detectChanges();
    pagina.motivo.setValue('  no  ');
    boton('Confirmar rechazo')?.click();
    fixture.detectChanges();

    http.expectNone(`${URL_CARGA}/rechazo`);
    expect(texto()).toContain('Escribe al menos 5 caracteres');
  });

  it('rechazar con motivo envia el motivo y muestra la carga rechazada', () => {
    const { fixture, http, texto, boton, raiz, responder, pagina } = preparar();
    responder();

    boton('Rechazar carga')?.click();
    fixture.detectChanges();
    pagina.motivo.setValue('  Faltan columnas del catastro  ');
    boton('Confirmar rechazo')?.click();

    const peticion = http.expectOne(`${URL_CARGA}/rechazo`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ motivo: 'Faltan columnas del catastro' });
    peticion.flush({ ok: true, data: detalle('rechazada', { motivoRechazo: 'Faltan columnas del catastro' }) });
    fixture.detectChanges();

    expect(raiz.querySelector('.insignia')?.textContent?.trim()).toBe('Rechazada');
    expect(texto()).toContain('Faltan columnas del catastro');
    expect(texto()).toContain('La carga fue rechazada');
    expect(boton('Rechazar carga')).toBeUndefined();
  });

  it('si la API no deja rechazar muestra su mensaje', () => {
    const { fixture, http, texto, boton, responder, pagina } = preparar();
    responder();

    boton('Rechazar carga')?.click();
    fixture.detectChanges();
    pagina.motivo.setValue('Motivo de prueba');
    boton('Confirmar rechazo')?.click();

    http.expectOne(`${URL_CARGA}/rechazo`).flush(
      { ok: false, code: 'CARGA_NO_EDITABLE', message: 'La carga ya no admite cambios en su estado actual' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('La carga ya no admite cambios en su estado actual');
  });
});