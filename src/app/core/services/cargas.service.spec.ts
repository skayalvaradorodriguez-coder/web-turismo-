import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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