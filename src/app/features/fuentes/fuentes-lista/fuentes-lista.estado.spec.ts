import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { FuentesListaPage } from './fuentes-lista.page';

const fuente = (id: number, nombre: string, estado: 'activa' | 'inactiva'): Fuente =>
  ({
    id, codigo: `fuente_${id}`, nombre, institucion: 'Institución', descripcion: null, tipoFuente: null,
    mecanismoAcceso: null, frecuenciaActualizacion: null, procedencia: null, licenciaUso: null,
    responsable: null, estado, creadoPor: 1, creadaEn: '', actualizadaEn: '',
  }) as Fuente;

function preparar(rol: string, lista: Fuente[]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { usuario: () => ({ rol }) } },
    ],
  });
  const fixture = TestBed.createComponent(FuentesListaPage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  http.expectOne(`${API_URL}/fuentes`).flush({ ok: true, data: { fuentes: lista } });
  fixture.detectChanges();

  const raiz = fixture.nativeElement as HTMLElement;
  const texto = () => raiz.textContent ?? '';
  const boton = (etiqueta: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === etiqueta) as HTMLButtonElement | undefined;
  const pulsar = (etiqueta: string) => {
    boton(etiqueta)?.click();
    fixture.detectChanges();
  };
  const insignia = () => raiz.querySelector('.insignia')?.textContent?.trim();
  return { fixture, http, texto, boton, pulsar, insignia };
}

describe('FuentesListaPage (activar y desactivar)', () => {
  it('una fuente activa ofrece Desactivar y una inactiva ofrece Activar', () => {
    const { boton } = preparar('admin', [fuente(1, 'Catastro', 'activa'), fuente(2, 'Playas', 'inactiva')]);
    expect(boton('Desactivar')).toBeTruthy();
    expect(boton('Activar')).toBeTruthy();
  });

  it('el investigador no ve botones de estado', () => {
    const { boton } = preparar('investigador', [fuente(1, 'Catastro', 'activa'), fuente(2, 'Playas', 'inactiva')]);
    expect(boton('Desactivar')).toBeUndefined();
    expect(boton('Activar')).toBeUndefined();
  });

  it('Desactivar pide confirmacion y todavia no llama a la API', () => {
    const { http, texto, pulsar } = preparar('admin', [fuente(1, 'Catastro', 'activa')]);
    pulsar('Desactivar');

    expect(texto()).toContain('¿Desactivar esta fuente?');
    http.expectNone(`${API_URL}/fuentes/1/estado`);
  });

  it('cancelar cierra la confirmacion sin llamar a la API', () => {
    const { http, texto, boton, pulsar } = preparar('admin', [fuente(1, 'Catastro', 'activa')]);
    pulsar('Desactivar');
    pulsar('Cancelar');

    http.expectNone(`${API_URL}/fuentes/1/estado`);
    expect(texto()).not.toContain('¿Desactivar esta fuente?');
    expect(boton('Desactivar')).toBeTruthy();
  });

  it('confirmar desactiva la fuente, actualiza la tarjeta y avisa', () => {
    const { fixture, http, texto, boton, pulsar, insignia } = preparar('admin', [fuente(1, 'Catastro', 'activa')]);
    pulsar('Desactivar');
    pulsar('Sí, desactivar');

    const peticion = http.expectOne(`${API_URL}/fuentes/1/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'inactiva' });
    peticion.flush({ ok: true, data: { fuente: fuente(1, 'Catastro', 'inactiva') } });
    fixture.detectChanges();

    expect(insignia()).toBe('Inactiva');
    expect(texto()).toContain('desactivada');
    expect(boton('Activar')).toBeTruthy();
  });

  it('activar no pide confirmacion', () => {
    const { fixture, http, texto, pulsar, insignia } = preparar('admin', [fuente(2, 'Playas', 'inactiva')]);
    pulsar('Activar');

    const peticion = http.expectOne(`${API_URL}/fuentes/2/estado`);
    expect(peticion.request.body).toEqual({ estado: 'activa' });
    peticion.flush({ ok: true, data: { fuente: fuente(2, 'Playas', 'activa') } });
    fixture.detectChanges();

    expect(insignia()).toBe('Activa');
    expect(texto()).toContain('activada');
  });

  it('si la API falla muestra el mensaje en la tarjeta y cierra la confirmacion', () => {
    const { fixture, http, texto, pulsar } = preparar('admin', [fuente(1, 'Catastro', 'activa')]);
    pulsar('Desactivar');
    pulsar('Sí, desactivar');

    http.expectOne(`${API_URL}/fuentes/1/estado`).flush(
      { ok: false, code: 'PERMISO_INSUFICIENTE', message: 'No tienes permiso para esta acción' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('No tienes permiso para esta acción');
    expect(texto()).not.toContain('¿Desactivar esta fuente?');
  });
});