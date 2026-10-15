import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { DetalleCarga, PaginaCargas } from '@app/core/models/carga.models';
import { CargasService } from './cargas.service';

describe('CargasService', () => {
  let servicio: CargasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(CargasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sin filtros no envia parametros y devuelve la pagina', () => {
    let resultado: PaginaCargas | undefined;
    servicio.listar().subscribe((pagina) => (resultado = pagina));

    const peticion = http.expectOne(`${API_URL}/cargas`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ ok: true, data: { cargas: [], total: 0, pagina: 1, limite: 50 } });

    expect(resultado).toEqual({ cargas: [], total: 0, pagina: 1, limite: 50 });
  });

  it('listar envia los filtros y la paginacion', () => {
    servicio.listar({ fuenteId: 3, estado: 'validada', pagina: 2, limite: 20 }).subscribe();

    const peticion = http.expectOne((r) => r.url === `${API_URL}/cargas`);
    expect(peticion.request.params.get('fuenteId')).toBe('3');
    expect(peticion.request.params.get('estado')).toBe('validada');
    expect(peticion.request.params.get('pagina')).toBe('2');
    expect(peticion.request.params.get('limite')).toBe('20');
    peticion.flush({ ok: true, data: { cargas: [], total: 0, pagina: 2, limite: 20 } });
  });

  it('obtener devuelve el detalle completo de la carga', () => {
    let detalle: DetalleCarga | undefined;
    servicio.obtener(9).subscribe((d) => (detalle = d));

    const peticion = http.expectOne(`${API_URL}/cargas/9`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ ok: true, data: { carga: { id: 9 }, archivos: [], metadatos: [] } });

    expect(detalle?.carga.id).toBe(9);
    expect(detalle?.archivos).toEqual([]);
  });
});

describe('CargasService (crear)', () => {
  let servicio: CargasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(CargasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia los datos y el archivo como formulario con archivo, sin nivel de ingreso', () => {
    const archivo = new File(['a,b\n1,2'], 'catastro.csv', { type: 'text/csv' });
    let detalle: DetalleCarga | undefined;
    servicio
      .crear(
        { fuenteId: 2, descripcion: 'Prueba', periodoDesde: '2026-01-01', periodoHasta: '2026-01-31', metadatos: { cobertura: 'Provincia' } },
        archivo,
      )
      .subscribe((d) => (detalle = d));

    const peticion = http.expectOne(`${API_URL}/cargas`);
    expect(peticion.request.method).toBe('POST');
    const cuerpo = peticion.request.body as FormData;
    expect(cuerpo.get('fuenteId')).toBe('2');
    expect(cuerpo.get('descripcion')).toBe('Prueba');
    expect(cuerpo.get('periodoDesde')).toBe('2026-01-01');
    expect(cuerpo.get('periodoHasta')).toBe('2026-01-31');
    expect(JSON.parse(cuerpo.get('metadatos') as string)).toEqual({ cobertura: 'Provincia' });
    expect((cuerpo.get('archivo') as File).name).toBe('catastro.csv');
    expect(cuerpo.has('nivelIngreso')).toBe(false);
    peticion.flush({ ok: true, data: { carga: { id: 9 }, archivos: [], metadatos: [] } }, { status: 201, statusText: 'Created' });

    expect(detalle?.carga.id).toBe(9);
  });

  it('no envia los campos opcionales que estan vacios', () => {
    servicio.crear({ fuenteId: 2, descripcion: '', metadatos: {} }, new File(['x'], 'a.csv')).subscribe();

    const peticion = http.expectOne(`${API_URL}/cargas`);
    const cuerpo = peticion.request.body as FormData;
    expect(cuerpo.has('descripcion')).toBe(false);
    expect(cuerpo.has('periodoDesde')).toBe(false);
    expect(cuerpo.has('periodoHasta')).toBe(false);
    expect(cuerpo.has('metadatos')).toBe(false);
    peticion.flush({ ok: true, data: { carga: { id: 1 }, archivos: [], metadatos: [] } });
  });
});

describe('CargasService (rechazar y descargar)', () => {
  let servicio: CargasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(CargasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('rechazar envia el motivo y devuelve el detalle', () => {
    let detalle: DetalleCarga | undefined;
    servicio.rechazar(5, 'Faltan columnas').subscribe((d) => (detalle = d));

    const peticion = http.expectOne(`${API_URL}/cargas/5/rechazo`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ motivo: 'Faltan columnas' });
    peticion.flush({ ok: true, data: { carga: { id: 5, estado: 'rechazada' }, archivos: [], metadatos: [] } });

    expect(detalle?.carga.estado).toBe('rechazada');
  });

  it('descargar pide el archivo como Blob', () => {
    let resultado: Blob | undefined;
    servicio.descargar(5, 3).subscribe((blob) => (resultado = blob));

    const peticion = http.expectOne(`${API_URL}/cargas/5/archivos/3/descarga`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.responseType).toBe('blob');
    peticion.flush(new Blob(['a,b']));

    expect(resultado instanceof Blob).toBe(true);
  });

  it('si la API responde con error, el mensaje de la API sigue disponible', async () => {
    let fallo: unknown;
    servicio.descargar(5, 3).subscribe({ error: (e: unknown) => (fallo = e) });

    http
      .expectOne(`${API_URL}/cargas/5/archivos/3/descarga`)
      .flush(new Blob([JSON.stringify({ ok: false, message: 'El archivo no existe' })]), {
        status: 404,
        statusText: 'Not Found',
      });
    await vi.waitFor(() => expect(fallo).toBeDefined());

    expect((fallo as { error: { message: string }; status: number }).error.message).toBe('El archivo no existe');
    expect((fallo as { status: number }).status).toBe(404);
  });
});