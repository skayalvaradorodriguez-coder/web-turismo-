import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaginaUsuarios, UsuarioGestion } from '@app/core/models/usuario.models';
import { AuthService } from '@app/core/services/auth.service';
import { UsuariosService } from '@app/core/services/usuarios.service';
import { UsuariosListaPage } from './usuarios-lista.page';

const usuario = (cambios: Partial<UsuarioGestion> = {}): UsuarioGestion => ({
  id: 9, nombres: 'Ana', apellidos: 'Pérez', email: 'ana@example.com', rol: 'externo', activo: true,
  emailVerificado: true, ultimoLoginEn: null, creadoEn: '2026-10-20T10:00:00.000Z', ...cambios,
});

const pagina = (usuarios: UsuarioGestion[]): PaginaUsuarios => ({ usuarios, total: usuarios.length, pagina: 1, limite: 20 });

describe('UsuariosListaPage', () => {
  const api = { listar: vi.fn(), cambiarRol: vi.fn(), cambiarEstado: vi.fn() };
  let actor = { id: 2, rol: 'admin' };

  beforeEach(() => {
    vi.resetAllMocks();
    actor = { id: 2, rol: 'admin' };
    TestBed.configureTestingModule({
      providers: [
        { provide: UsuariosService, useValue: api },
        { provide: AuthService, useValue: { usuario: () => actor } },
      ],
    });
  });

  function crear(usuarios: UsuarioGestion[]) {
    api.listar.mockReturnValue(of(pagina(usuarios)));
    const fixture = TestBed.createComponent(UsuariosListaPage);
    fixture.detectChanges();
    return fixture;
  }

  const raiz = (f: ComponentFixture<unknown>) => f.nativeElement as HTMLElement;
  const contenido = (f: ComponentFixture<unknown>): string => raiz(f).textContent ?? '';
  const acciones = (f: ComponentFixture<unknown>): string[] =>
    Array.from(raiz(f).querySelectorAll('.usuario button')).map((b) => b.textContent?.trim() ?? '');
  const boton = (f: ComponentFixture<unknown>, texto: string) =>
    Array.from(raiz(f).querySelectorAll('button')).find((b) => b.textContent?.trim() === texto);

  it('muestra cada cuenta con su nombre, rol y estado', () => {
    const f = crear([usuario(), usuario({ id: 10, nombres: 'Luis', apellidos: 'Mora', rol: 'investigador', activo: false })]);

    expect(contenido(f)).toContain('Ana Pérez');
    expect(contenido(f)).toContain('Luis Mora');
    expect(contenido(f)).toContain('Externo');
    expect(contenido(f)).toContain('Investigador');
    expect(contenido(f)).toContain('Inactiva');
  });

  it('el super administrador ve cambiar rol y desactivar en otras cuentas, y nada en la suya', () => {
    actor = { id: 1, rol: 'super_admin' };
    const f = crear([usuario({ id: 1, nombres: 'Yo', rol: 'super_admin' }), usuario()]);

    expect(acciones(f)).toEqual(['Cambiar rol', 'Desactivar']);
  });

  it('el admin no ve acciones sobre otro admin ni sobre un super administrador', () => {
    const f = crear([usuario({ id: 3, rol: 'admin' }), usuario({ id: 1, rol: 'super_admin' })]);

    expect(acciones(f)).toEqual([]);
  });

  it('cambiar rol ofrece solo los roles permitidos, guarda el elegido y muestra el aviso', () => {
    const f = crear([usuario()]);
    api.cambiarRol.mockReturnValue(of(usuario({ rol: 'investigador' })));

    boton(f, 'Cambiar rol')?.click();
    f.detectChanges();
    const select = raiz(f).querySelector<HTMLSelectElement>('.usuario select');
    expect(Array.from(select?.options ?? []).map((o) => o.value)).toEqual(['', 'investigador']);
    expect(boton(f, 'Guardar')?.disabled).toBe(true);

    if (select) {
      select.value = 'investigador';
      select.dispatchEvent(new Event('change'));
    }
    f.detectChanges();
    expect(boton(f, 'Guardar')?.disabled).toBe(false);

    boton(f, 'Guardar')?.click();
    f.detectChanges();

    expect(api.cambiarRol).toHaveBeenCalledWith(9, 'investigador');
    expect(contenido(f)).toContain('Rol de Ana Pérez cambiado a Investigador.');
    expect(raiz(f).querySelector('.usuario select')).toBeNull();
  });

  it('desactivar pide confirmación antes de llamar a la API', () => {
    const f = crear([usuario()]);
    api.cambiarEstado.mockReturnValue(of(usuario({ activo: false })));

    boton(f, 'Desactivar')?.click();
    f.detectChanges();
    expect(api.cambiarEstado).not.toHaveBeenCalled();
    expect(acciones(f)).toEqual(['Sí, desactivar', 'Cancelar']);

    boton(f, 'Sí, desactivar')?.click();
    f.detectChanges();

    expect(api.cambiarEstado).toHaveBeenCalledWith(9, 'inactiva');
    expect(contenido(f)).toContain('Cuenta de Ana Pérez desactivada.');
    expect(acciones(f)).toEqual(['Cambiar rol', 'Activar']);
  });

  it('activar una cuenta va directo, sin confirmación', () => {
    const f = crear([usuario({ activo: false })]);
    api.cambiarEstado.mockReturnValue(of(usuario()));

    boton(f, 'Activar')?.click();
    f.detectChanges();

    expect(api.cambiarEstado).toHaveBeenCalledWith(9, 'activa');
    expect(contenido(f)).toContain('Cuenta de Ana Pérez activada.');
  });

  it('si la API responde con error, muestra su mensaje dentro de esa cuenta', () => {
    const f = crear([usuario({ activo: false })]);
    const error = new HttpErrorResponse({ status: 403, error: { ok: false, code: 'PERMISO_INSUFICIENTE', message: 'No tienes permiso para esto' } });
    api.cambiarEstado.mockReturnValue(throwError(() => error));

    boton(f, 'Activar')?.click();
    f.detectChanges();

    expect(raiz(f).querySelector('.usuario .error')?.textContent).toContain('No tienes permiso para esto');
  });

  it('cambiar el filtro de rol vuelve a pedir la página 1 con ese rol', () => {
    const f = crear([]);
    const select = raiz(f).querySelector<HTMLSelectElement>('#filtro-rol');

    if (select) {
      select.value = 'externo';
      select.dispatchEvent(new Event('change'));
    }
    f.detectChanges();

    expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ rol: 'externo', pagina: 1, limite: 20 }));
  });

  it('buscar por texto pide la lista con ese texto', () => {
    const f = crear([]);
    const campo = raiz(f).querySelector<HTMLInputElement>('#filtro-texto');
    const formulario = raiz(f).querySelector('form');

    if (campo) {
      campo.value = ' ana ';
      campo.dispatchEvent(new Event('input'));
    }
    formulario?.dispatchEvent(new Event('submit'));
    f.detectChanges();

    expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ texto: 'ana', pagina: 1 }));
  });

  it('sin cuentas para los filtros lo dice', () => {
    expect(contenido(crear([]))).toContain('No hay cuentas con estos filtros.');
  });
});