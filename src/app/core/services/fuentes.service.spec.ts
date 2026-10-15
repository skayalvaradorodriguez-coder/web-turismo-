import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Fuente } from '@app/core/models/fuente.models';
import { FuentesService } from './fuentes.service';

const fuente = { id: 7, codigo: 'catastro_turistico', nombre: 'Catastro', estado: 'activa' } as unknown as Fuente;

describe('FuentesService', () => {
  let servicio: FuentesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(FuentesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sin filtro pide /fuentes y devuelve la lista', () => {
    let recibido: Fuente[] | undefined;
    servicio.listar().subscribe((f) => (recibido = f));

    const peticion = http.expectOne(`${API_URL}/fuentes`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush({ ok: true, data: { fuentes: [fuente] } });

    expect(recibido).toEqual([fuente]);
  });

  it('listar con estado envia el filtro en la consulta', () => {
    servicio.listar('inactiva').subscribe();

    const peticion = http.expectOne((r) => r.url === `${API_URL}/fuentes`);
    expect(peticion.request.params.get('estado')).toBe('inactiva');
    peticion.flush({ ok: true, data: { fuentes: [] } });
  });

  it('obtener pide /fuentes/:id', () => {
    let recibido: Fuente | undefined;
    servicio.obtener(7).subscribe((f) => (recibido = f));

    const peticion = http.expectOne(`${API_URL}/fuentes/7`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ ok: true, data: { fuente } });

    expect(recibido).toEqual(fuente);
  });

  it('crear envia los datos por POST', () => {
    const datos = { codigo: 'catastro_turistico', nombre: 'Catastro', institucion: 'Ministerio' };
    let recibido: Fuente | undefined;
    servicio.crear(datos).subscribe((f) => (recibido = f));

    const peticion = http.expectOne(`${API_URL}/fuentes`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(datos);
    peticion.flush({ ok: true, data: { fuente } }, { status: 201, statusText: 'Created' });

    expect(recibido).toEqual(fuente);
  });

  it('editar envia los datos por PUT a /fuentes/:id', () => {
    const datos = { nombre: 'Catastro 2026', institucion: 'Ministerio de Turismo' };
    servicio.editar(7, datos).subscribe();

    const peticion = http.expectOne(`${API_URL}/fuentes/7`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual(datos);
    peticion.flush({ ok: true, data: { fuente } });
  });

  it('cambiarEstado envia solo el estado por PATCH', () => {
    servicio.cambiarEstado(7, 'inactiva').subscribe();

    const peticion = http.expectOne(`${API_URL}/fuentes/7/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'inactiva' });
    peticion.flush({ ok: true, data: { fuente } });
  });

  it('propaga el error de la API (por ejemplo 403 sin permiso)', () => {
    let estado: number | undefined;
    servicio.crear({ codigo: 'abc', nombre: 'Abc', institucion: 'Inst' }).subscribe({ error: (e) => (estado = e.status) });

    http.expectOne(`${API_URL}/fuentes`).flush({ ok: false }, { status: 403, statusText: 'Forbidden' });

    expect(estado).toBe(403);
  });
});