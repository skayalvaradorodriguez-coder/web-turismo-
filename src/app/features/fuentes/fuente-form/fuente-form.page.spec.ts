import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Fuente } from '@app/core/models/fuente.models';
import { FuenteFormPage } from './fuente-form.page';

const fuenteGuardada = {
  id: 7, codigo: 'catastro_turistico', nombre: 'Catastro', institucion: 'Ministerio', descripcion: 'Registros',
  tipoFuente: null, mecanismoAcceso: 'descarga_manual', frecuenciaActualizacion: null, procedencia: null,
  licenciaUso: null, responsable: null, estado: 'activa', creadoPor: 1, creadaEn: '', actualizadaEn: '',
} as Fuente;

function preparar(id: string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
      },
    ],
  });
  const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(FuenteFormPage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, http, navegar, pagina: fixture.componentInstance };
}

describe('FuenteFormPage (crear)', () => {
  let ctx: ReturnType<typeof preparar>;
  beforeEach(() => {
    ctx = preparar(null);
  });

  it('con datos invalidos no llama a la API y marca los campos', () => {
    ctx.pagina.enviar();
    ctx.http.expectNone(`${API_URL}/fuentes`);
    expect(ctx.pagina.form.controls.nombre.touched).toBe(true);
  });

  it('el codigo solo admite minusculas, numeros y guion bajo', () => {
    const codigo = ctx.pagina.form.controls.codigo;
    codigo.setValue('Catastro Turistico');
    expect(codigo.errors?.['pattern']).toBeTruthy();
    codigo.setValue('catastro_turistico');
    expect(codigo.valid).toBe(true);
  });

  it('crea la fuente con los datos limpios y vuelve a la lista con un aviso', () => {
    ctx.pagina.form.patchValue({ codigo: 'siete_playas', nombre: '  Siete playas ', institucion: 'Dirección de Turismo' });
    ctx.pagina.enviar();

    const peticion = ctx.http.expectOne(`${API_URL}/fuentes`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toMatchObject({ codigo: 'siete_playas', nombre: 'Siete playas', institucion: 'Dirección de Turismo' });
    peticion.flush({ ok: true, data: { fuente: fuenteGuardada } }, { status: 201, statusText: 'Created' });

    expect(ctx.navegar).toHaveBeenCalledWith('/fuentes', { state: { aviso: expect.any(String) } });
  });

  it('muestra debajo del campo el error que devuelve la API', () => {
    ctx.pagina.form.patchValue({ codigo: 'abc', nombre: 'Nombre valido', institucion: 'Inst' });
    ctx.pagina.enviar();

    ctx.http.expectOne(`${API_URL}/fuentes`).flush(
      { ok: false, code: 'VALIDACION', message: 'Datos invalidos', details: [{ campo: 'codigo', mensaje: 'Ya existe una fuente con ese código' }] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(ctx.pagina.form.controls.codigo.errors?.['servidor']).toBe(true);
    expect(ctx.navegar).not.toHaveBeenCalled();
  });

  it('un error sin detalles se muestra como mensaje general', () => {
    ctx.pagina.form.patchValue({ codigo: 'abc', nombre: 'Nombre valido', institucion: 'Inst' });
    ctx.pagina.enviar();

    ctx.http.expectOne(`${API_URL}/fuentes`).flush(
      { ok: false, code: 'PERMISO_INSUFICIENTE', message: 'No tienes permiso para esta acción' },
      { status: 403, statusText: 'Forbidden' },
    );
    ctx.fixture.detectChanges();

    expect((ctx.fixture.nativeElement as HTMLElement).textContent).toContain('No tienes permiso para esta acción');
  });
});

describe('FuenteFormPage (editar)', () => {
  it('carga la fuente, bloquea el codigo y no lo envia al guardar', () => {
    const { pagina, http, navegar } = preparar('7');

    http.expectOne(`${API_URL}/fuentes/7`).flush({ ok: true, data: { fuente: fuenteGuardada } });

    expect(pagina.form.controls.nombre.value).toBe('Catastro');
    expect(pagina.form.controls.mecanismoAcceso.value).toBe('descarga_manual');
    expect(pagina.form.controls.codigo.disabled).toBe(true);

    pagina.form.patchValue({ nombre: 'Catastro 2026' });
    pagina.enviar();

    const peticion = http.expectOne(`${API_URL}/fuentes/7`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).not.toHaveProperty('codigo');
    expect(peticion.request.body).toMatchObject({ nombre: 'Catastro 2026' });
    peticion.flush({ ok: true, data: { fuente: fuenteGuardada } });

    expect(navegar).toHaveBeenCalledWith('/fuentes', { state: { aviso: expect.any(String) } });
  });

  it('si la fuente no existe muestra el mensaje de la API', () => {
    const { fixture, http } = preparar('999');

    http.expectOne(`${API_URL}/fuentes/999`).flush(
      { ok: false, code: 'FUENTE_NO_ENCONTRADA', message: 'La fuente no existe' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('La fuente no existe');
  });
});