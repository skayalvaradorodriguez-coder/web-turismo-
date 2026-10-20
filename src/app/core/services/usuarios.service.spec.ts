import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { PaginaUsuarios, UsuarioGestion } from '@app/core/models/usuario.models';
import { UsuariosService } from './usuarios.service';

const usuario: UsuarioGestion = {
  id: 7,
  nombres: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@example.com',
  rol: 'externo',
  activo: true,
  emailVerificado: true,
  ultimoLoginEn: null,
  creadoEn: '2026-10-20T10:00:00.000Z',
};

describe('UsuariosService', () => {
  let servicio: UsuariosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sin filtros no envía parámetros', () => {
    servicio.listar().subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/usuarios`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ ok: true, data: { usuarios: [], total: 0, pagina: 1, limite: 50 } });
  });

  it('listar envía solo los filtros indicados y devuelve la página', () => {
    const recibidas: PaginaUsuarios[] = [];
    servicio.listar({ rol: 'externo', estado: 'inactiva', texto: 'ana', pagina: 2, limite: 20 }).subscribe((p) => recibidas.push(p));

    const req = http.expectOne((r) => r.url === `${API_URL}/usuarios`);
    expect(req.request.params.get('rol')).toBe('externo');
    expect(req.request.params.get('estado')).toBe('inactiva');
    expect(req.request.params.get('texto')).toBe('ana');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('limite')).toBe('20');
    req.flush({ ok: true, data: { usuarios: [usuario], total: 1, pagina: 2, limite: 20 } });

    expect(recibidas[0]?.usuarios).toEqual([usuario]);
  });

  it('cambiarRol envía PATCH con el rol y devuelve la cuenta actualizada', () => {
    const recibidas: UsuarioGestion[] = [];
    servicio.cambiarRol(7, 'investigador').subscribe((u) => recibidas.push(u));

    const req = http.expectOne(`${API_URL}/usuarios/7/rol`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ rol: 'investigador' });
    req.flush({ ok: true, data: { usuario: { ...usuario, rol: 'investigador' } } });

    expect(recibidas[0]?.rol).toBe('investigador');
  });

  it('cambiarEstado envía PATCH con el estado en palabras', () => {
    const recibidas: UsuarioGestion[] = [];
    servicio.cambiarEstado(7, 'inactiva').subscribe((u) => recibidas.push(u));

    const req = http.expectOne(`${API_URL}/usuarios/7/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'inactiva' });
    req.flush({ ok: true, data: { usuario: { ...usuario, activo: false } } });

    expect(recibidas[0]?.activo).toBe(false);
  });
});