import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Fuente } from '@app/core/models/fuente.models';
import { FuentesListaPage } from './fuentes-lista.page';

const fuente = (id: number, nombre: string, estado: 'activa' | 'inactiva'): Fuente =>
  ({
    id, codigo: `fuente_${id}`, nombre, institucion: 'Institución', descripcion: null, tipoFuente: null,
    mecanismoAcceso: null, frecuenciaActualizacion: null, procedencia: null, licenciaUso: null,
    responsable: null, estado, creadoPor: 1, creadaEn: '', actualizadaEn: '',
  }) as Fuente;

describe('FuentesListaPage', () => {
  let fixture: ComponentFixture<FuentesListaPage>;
  let http: HttpTestingController;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const tarjetas = () => (fixture.nativeElement as HTMLElement).querySelectorAll('.fuente').length;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(FuentesListaPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('muestra "Cargando" mientras espera la API', () => {
    expect(texto()).toContain('Cargando fuentes');
    http.expectOne(`${API_URL}/fuentes`);
  });

  it('muestra una tarjeta por fuente', () => {
    http.expectOne(`${API_URL}/fuentes`).flush({
      ok: true,
      data: { fuentes: [fuente(1, 'Catastro', 'activa'), fuente(2, 'Playas', 'inactiva')] },
    });
    fixture.detectChanges();

    expect(tarjetas()).toBe(2);
    expect(texto()).toContain('Catastro');
    expect(texto()).toContain('Inactiva');
  });

  it('sin fuentes muestra el estado vacio', () => {
    http.expectOne(`${API_URL}/fuentes`).flush({ ok: true, data: { fuentes: [] } });
    fixture.detectChanges();

    expect(tarjetas()).toBe(0);
    expect(texto()).toContain('Aún no hay fuentes registradas');
  });

  it('si la API falla muestra el mensaje de la API y permite reintentar', () => {
    http.expectOne(`${API_URL}/fuentes`).flush(
      { ok: false, code: 'PERMISO_INSUFICIENTE', message: 'No tienes permiso para esta acción' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('No tienes permiso para esta acción');
    expect(texto()).toContain('Reintentar');
  });
});