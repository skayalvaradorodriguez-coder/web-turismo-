import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Carga, EstadoCarga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargasListaPage } from './cargas-lista.page';

const URL_CARGAS = `${API_URL}/cargas`;
const URL_FUENTES = `${API_URL}/fuentes`;

const carga = (id: number, fuenteId: number, estado: EstadoCarga, extra: Partial<Carga> = {}): Carga => ({
  id, fuenteId, estructuraId: null, descripcion: null, periodoDesde: '2025-01-01', periodoHasta: '2025-03-31',
  nivelIngreso: 1, estado, motivoRechazo: null, cargadoPor: 1, publicadaPor: null, publicadaEn: null,
  creadaEn: '2025-04-02T15:00:00.000Z', actualizadaEn: '2025-04-02T15:00:00.000Z', ...extra,
});

const fuente = (id: number, nombre: string) => ({ id, nombre }) as Fuente;

function preparar(rol = 'admin') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { usuario: () => ({ rol }) } },
    ],
  });
  const fixture = TestBed.createComponent(CargasListaPage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  const raiz = fixture.nativeElement as HTMLElement;
  const texto = () => raiz.textContent ?? '';
  const pedidoCargas = (cumple: (p: HttpParams) => boolean = () => true) =>
    http.expectOne((r) => r.url === URL_CARGAS && cumple(r.params));
  const boton = (etiqueta: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === etiqueta) as HTMLButtonElement | undefined;
  const responder = (fuentes: Fuente[], cargas: Carga[], total = cargas.length) => {
    http.expectOne(URL_FUENTES).flush({ ok: true, data: { fuentes } });
    pedidoCargas().flush({ ok: true, data: { cargas, total, pagina: 1, limite: 20 } });
    fixture.detectChanges();
  };
  return { fixture, http, raiz, texto, boton, pedidoCargas, responder };
}

describe('CargasListaPage', () => {
  it('muestra "Cargando" mientras espera la API', () => {
    const { texto, http, pedidoCargas } = preparar();
    expect(texto()).toContain('Cargando cargas');
    http.expectOne(URL_FUENTES);
    pedidoCargas();
  });

  it('muestra una tarjeta por carga con el nombre de su fuente y su periodo', () => {
    const { raiz, texto, responder } = preparar();
    responder([fuente(1, 'Catastro Turístico')], [carga(10, 1, 'validada'), carga(11, 1, 'publicada')]);

    expect(raiz.querySelectorAll('.carga').length).toBe(2);
    expect(Array.from(raiz.querySelectorAll('.insignia')).map((e) => e.textContent?.trim())).toEqual(['Validada', 'Publicada']);
    expect(texto()).toContain('Catastro Turístico');
    expect(texto()).toContain('1 ene 2025 – 31 mar 2025');
  });

  it('si no se pudo leer la fuente muestra su numero', () => {
    const { http, pedidoCargas, fixture, texto } = preparar();
    http.expectOne(URL_FUENTES).flush({ ok: false, message: 'Error' }, { status: 500, statusText: 'Server Error' });
    pedidoCargas().flush({ ok: true, data: { cargas: [carga(10, 7, 'recibida')], total: 1, pagina: 1, limite: 20 } });
    fixture.detectChanges();

    expect(texto()).toContain('Fuente #7');
  });

  it('una carga rechazada muestra el motivo', () => {
    const { texto, responder } = preparar();
    responder([fuente(1, 'Catastro')], [carga(10, 1, 'rechazada', { motivoRechazo: 'Faltan columnas del catastro' })]);

    expect(texto()).toContain('Faltan columnas del catastro');
  });

  it('sin cargas muestra el estado vacio', () => {
    const { texto, responder } = preparar();
    responder([], []);

    expect(texto()).toContain('Aún no hay cargas registradas');
  });

  it('si la API falla muestra su mensaje y permite reintentar', () => {
    const { http, pedidoCargas, fixture, texto, boton } = preparar();
    http.expectOne(URL_FUENTES).flush({ ok: true, data: { fuentes: [] } });
    pedidoCargas().flush(
      { ok: false, code: 'PERMISO_INSUFICIENTE', message: 'No tienes permiso para esta acción' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('No tienes permiso para esta acción');
    boton('Reintentar')?.click();
    pedidoCargas();
  });

  it('filtrar por estado pide solo ese estado desde la pagina 1', () => {
    const { raiz, fixture, responder, pedidoCargas } = preparar();
    responder([], []);

    const selector = raiz.querySelector('#filtro-estado') as HTMLSelectElement;
    selector.value = 'validada';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    pedidoCargas((p) => p.get('estado') === 'validada' && p.get('pagina') === '1');
  });

  it('con varias paginas, Siguiente pide la pagina 2 y Anterior empieza bloqueado', () => {
    const { fixture, boton, responder, pedidoCargas } = preparar();
    responder([], [carga(10, 1, 'recibida')], 45);

    expect(boton('Anterior')?.disabled).toBe(true);
    boton('Siguiente')?.click();
    fixture.detectChanges();

    pedidoCargas((p) => p.get('pagina') === '2');
  });

  it('gestion ve el boton "Nueva carga"', () => {
    const { texto, responder } = preparar('admin');
    responder([], []);

    expect(texto()).toContain('Nueva carga');
  });

  it('el investigador solo consulta: no ve "Nueva carga"', () => {
    const { texto, responder } = preparar('investigador');
    responder([], []);

    expect(texto()).not.toContain('Nueva carga');
  });
});