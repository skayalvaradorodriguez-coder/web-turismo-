import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Fuente } from '@app/core/models/fuente.models';
import { CargaFormPage } from './carga-form.page';

const URL_CARGAS = `${API_URL}/cargas`;
const URL_FUENTES = `${API_URL}/fuentes`;
const fuente = (id: number, nombre: string) => ({ id, nombre }) as Fuente;
const eventoConArchivo = (archivo: File) => ({ target: { files: [archivo] } }) as unknown as Event;
const csv = () => new File(['a,b\n1,2'], 'catastro.csv', { type: 'text/csv' });

function preparar(fuentes: Fuente[] = [fuente(1, 'Catastro'), fuente(2, 'Playas')]) {
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(CargaFormPage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  http
    .expectOne((r) => r.urlWithParams.startsWith(URL_FUENTES) && r.urlWithParams.includes('estado=activa'))
    .flush({ ok: true, data: { fuentes } });
  fixture.detectChanges();

  const raiz = fixture.nativeElement as HTMLElement;
  const texto = () => raiz.textContent ?? '';
  const peticionCarga = () => http.expectOne((r) => r.method === 'POST' && r.url === URL_CARGAS);
  return { fixture, http, raiz, texto, navegar, pagina: fixture.componentInstance, peticionCarga };
}

describe('CargaFormPage', () => {
  it('ofrece solo las fuentes activas que devuelve la API', () => {
    const { raiz } = preparar();
    expect(raiz.querySelectorAll('#fuente option').length).toBe(3); // la indicacion + 2 fuentes
  });

  it('sin fuentes activas avisa y no muestra el formulario', () => {
    const { raiz, texto } = preparar([]);
    expect(texto()).toContain('No hay fuentes activas');
    expect(raiz.querySelector('form')).toBeNull();
  });

  it('sin fuente ni archivo no llama a la API y marca los campos', () => {
    const { fixture, http, texto, pagina } = preparar();
    pagina.enviar();
    fixture.detectChanges();

    http.expectNone((r) => r.method === 'POST');
    expect(pagina.form.controls.fuenteId.touched).toBe(true);
    expect(texto()).toContain('Elige la fuente de la carga');
    expect(texto()).toContain('Selecciona el archivo que quieres cargar');
  });

  it('rechaza un archivo con un formato no permitido', () => {
    const { fixture, texto, pagina } = preparar();
    pagina.alElegirArchivo(eventoConArchivo(new File(['x'], 'programa.exe')));
    fixture.detectChanges();

    expect(texto()).toContain('no está permitido');
  });

  it('rechaza un archivo vacio', () => {
    const { fixture, texto, pagina } = preparar();
    pagina.alElegirArchivo(eventoConArchivo(new File([], 'vacio.csv')));
    fixture.detectChanges();

    expect(texto()).toContain('El archivo está vacío');
  });

  it('envia la fuente, el archivo, el periodo y los metadatos, y vuelve a la lista con un aviso', () => {
    const { navegar, pagina, peticionCarga } = preparar();
    pagina.form.patchValue({ fuenteId: '2', descripcion: ' Prueba ', periodoDesde: '2026-01-01', periodoHasta: '2026-01-31' });
    pagina.agregarMetadato();
    pagina.metadatos.at(0).setValue({ clave: 'cobertura', valor: ' Provincia ' });
    pagina.alElegirArchivo(eventoConArchivo(csv()));
    pagina.enviar();

    const peticion = peticionCarga();
    const cuerpo = peticion.request.body as FormData;
    expect(cuerpo.get('fuenteId')).toBe('2');
    expect(cuerpo.get('descripcion')).toBe('Prueba');
    expect(cuerpo.get('periodoDesde')).toBe('2026-01-01');
    expect(JSON.parse(cuerpo.get('metadatos') as string)).toEqual({ cobertura: 'Provincia' });
    expect((cuerpo.get('archivo') as File).name).toBe('catastro.csv');
    peticion.flush({ ok: true, data: { carga: { id: 9 }, archivos: [], metadatos: [] } }, { status: 201, statusText: 'Created' });

    expect(navegar).toHaveBeenCalledWith('/cargas', { state: { aviso: expect.stringContaining('#9') } });
  });

  it('no envia los campos opcionales vacios', () => {
    const { pagina, peticionCarga } = preparar();
    pagina.form.patchValue({ fuenteId: '1' });
    pagina.alElegirArchivo(eventoConArchivo(csv()));
    pagina.enviar();

    const peticion = peticionCarga();
    const cuerpo = peticion.request.body as FormData;
    expect(cuerpo.has('descripcion')).toBe(false);
    expect(cuerpo.has('periodoDesde')).toBe(false);
    expect(cuerpo.has('metadatos')).toBe(false);
    peticion.flush({ ok: true, data: { carga: { id: 1 }, archivos: [], metadatos: [] } });
  });

  it('un periodo con el fin antes del inicio no se envia', () => {
    const { http, pagina } = preparar();
    pagina.form.patchValue({ fuenteId: '1', periodoDesde: '2026-02-01', periodoHasta: '2026-01-01' });
    pagina.alElegirArchivo(eventoConArchivo(csv()));
    pagina.enviar();

    expect(pagina.form.hasError('periodoInvertido')).toBe(true);
    http.expectNone((r) => r.method === 'POST');
  });

  it('un metadato incompleto o con nombre repetido no se envia', () => {
    const { http, pagina } = preparar();
    pagina.form.patchValue({ fuenteId: '1' });
    pagina.alElegirArchivo(eventoConArchivo(csv()));

    pagina.agregarMetadato();
    pagina.metadatos.at(0).setValue({ clave: 'cobertura', valor: '' });
    expect(pagina.metadatos.at(0).hasError('incompleto')).toBe(true);

    pagina.metadatos.at(0).setValue({ clave: 'Cobertura', valor: 'A' });
    pagina.agregarMetadato();
    pagina.metadatos.at(1).setValue({ clave: 'cobertura', valor: 'B' });
    expect(pagina.metadatos.hasError('repetidos')).toBe(true);

    pagina.enviar();
    http.expectNone((r) => r.method === 'POST');
  });

  it('muestra debajo del campo el error que devuelve la API', () => {
    const { fixture, texto, pagina, peticionCarga } = preparar();
    pagina.form.patchValue({ fuenteId: '1' });
    pagina.alElegirArchivo(eventoConArchivo(csv()));
    pagina.enviar();

    peticionCarga().flush(
      {
        ok: false,
        code: 'VALIDACION',
        message: 'Datos invalidos',
        details: [{ campo: 'periodoHasta', mensaje: 'El fin del periodo no puede ser anterior al inicio' }],
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(pagina.form.controls.periodoHasta.errors?.['servidor']).toBe(true);
    expect(texto()).toContain('El fin del periodo no puede ser anterior al inicio');
  });

  it('un error sin detalles se muestra como mensaje general', () => {
    const { fixture, texto, pagina, peticionCarga } = preparar();
    pagina.form.patchValue({ fuenteId: '1' });
    pagina.alElegirArchivo(eventoConArchivo(csv()));
    pagina.enviar();

    peticionCarga().flush(
      { ok: false, code: 'ARCHIVO_MUY_GRANDE', message: 'El archivo supera el tamano maximo de 100 MB' },
      { status: 413, statusText: 'Payload Too Large' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('El archivo supera el tamano maximo de 100 MB');
  });
});