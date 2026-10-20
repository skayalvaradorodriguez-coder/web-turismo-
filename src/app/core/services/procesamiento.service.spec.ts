import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { PaginaHallazgos, Procesamiento, ResultadoProcesamiento } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from './procesamiento.service';

const procesamiento: Procesamiento = {
  id: 91,
  cargaId: 10,
  archivoId: 55,
  tipo: 'validacion',
  estado: 'completado',
  totalFilas: 2,
  totalErrores: 0,
  totalAlertas: 1,
  mensajeError: null,
  ejecutadoPor: 7,
  iniciadoEn: '2026-10-20T10:00:00.000Z',
  finalizadoEn: '2026-10-20T10:00:01.000Z',
};

describe('ProcesamientoService', () => {
  let servicio: ProcesamientoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ProcesamientoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validar envia un POST sin cuerpo y devuelve el resultado', () => {
    const recibidos: ResultadoProcesamiento[] = [];
    servicio.validar(10).subscribe((r) => recibidos.push(r));

    const req = http.expectOne(`${API_URL}/cargas/10/validar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ ok: true, data: { procesamiento, resumen: [], estadoCarga: 'validada' } });

    expect(recibidos[0]?.estadoCarga).toBe('validada');
    expect(recibidos[0]?.procesamiento.id).toBe(91);
  });

  it('procesar envia un POST sin cuerpo a la ruta de procesar', () => {
    const recibidos: ResultadoProcesamiento[] = [];
    servicio.procesar(10).subscribe((r) => recibidos.push(r));

    const req = http.expectOne(`${API_URL}/cargas/10/procesar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ ok: true, data: { procesamiento: { ...procesamiento, tipo: 'procesamiento' }, resumen: [], estadoCarga: 'procesada' } });

    expect(recibidos[0]?.estadoCarga).toBe('procesada');
  });

  it('listar devuelve solo la lista de procesamientos', () => {
    const recibidos: Procesamiento[][] = [];
    servicio.listar(10).subscribe((lista) => recibidos.push(lista));

    const req = http.expectOne(`${API_URL}/cargas/10/procesamientos`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, data: { procesamientos: [procesamiento] } });

    expect(recibidos[0]).toEqual([procesamiento]);
  });

  it('hallazgos envia los filtros indicados', () => {
    const recibidos: PaginaHallazgos[] = [];
    servicio.hallazgos(10, 91, { severidad: 'error', regla: 'provincia_distinta', pagina: 2, limite: 25 }).subscribe((p) => recibidos.push(p));

    const req = http.expectOne((r) => r.url === `${API_URL}/cargas/10/procesamientos/91/hallazgos`);
    expect(req.request.params.get('severidad')).toBe('error');
    expect(req.request.params.get('regla')).toBe('provincia_distinta');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('limite')).toBe('25');
    req.flush({ ok: true, data: { hallazgos: [], total: 0, resumen: [], pagina: 2, limite: 25 } });

    expect(recibidos[0]?.pagina).toBe(2);
  });

  it('hallazgos sin filtros no envia parametros', () => {
    servicio.hallazgos(10, 91).subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/cargas/10/procesamientos/91/hallazgos`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ ok: true, data: { hallazgos: [], total: 0, resumen: [], pagina: 1, limite: 50 } });
  });
});