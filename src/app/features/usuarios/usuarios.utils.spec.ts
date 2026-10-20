import { describe, expect, it } from 'vitest';
import { etiquetaEstadoUsuario, nombreCompleto, permisosSobre, ultimoAcceso } from './usuarios.utils';

const superAdmin = { id: 1, rol: 'super_admin' };
const admin = { id: 2, rol: 'admin' };
const sinPermisos = { rolesDisponibles: [], puedeCambiarEstado: false };

describe('permisosSobre', () => {
  it('el super administrador puede pasar un externo a admin o investigador, y activar o desactivar', () => {
    expect(permisosSobre(superAdmin, { id: 9, rol: 'externo' })).toEqual({
      rolesDisponibles: ['admin', 'investigador'],
      puedeCambiarEstado: true,
    });
  });

  it('el super administrador puede bajar a un admin y desactivarlo', () => {
    expect(permisosSobre(superAdmin, { id: 9, rol: 'admin' })).toEqual({
      rolesDisponibles: ['investigador', 'externo'],
      puedeCambiarEstado: true,
    });
  });

  it('el admin mueve entre externo e investigador, y nunca ofrece el rol admin', () => {
    expect(permisosSobre(admin, { id: 9, rol: 'externo' })).toEqual({ rolesDisponibles: ['investigador'], puedeCambiarEstado: true });
    expect(permisosSobre(admin, { id: 9, rol: 'investigador' })).toEqual({ rolesDisponibles: ['externo'], puedeCambiarEstado: true });
  });

  it('el admin no toca a otro admin', () => {
    expect(permisosSobre(admin, { id: 9, rol: 'admin' })).toEqual(sinPermisos);
  });

  it('nadie modifica su propia cuenta', () => {
    expect(permisosSobre(superAdmin, { id: 1, rol: 'super_admin' })).toEqual(sinPermisos);
    expect(permisosSobre(admin, { id: 2, rol: 'admin' })).toEqual(sinPermisos);
  });

  it('nadie modifica la cuenta de un super administrador', () => {
    expect(permisosSobre(admin, { id: 1, rol: 'super_admin' })).toEqual(sinPermisos);
    expect(permisosSobre(superAdmin, { id: 5, rol: 'super_admin' })).toEqual(sinPermisos);
  });

  it('un investigador o un externo no gestionan cuentas', () => {
    expect(permisosSobre({ id: 3, rol: 'investigador' }, { id: 9, rol: 'externo' })).toEqual(sinPermisos);
    expect(permisosSobre({ id: 4, rol: 'externo' }, { id: 9, rol: 'externo' })).toEqual(sinPermisos);
  });
});

describe('textos de usuarios', () => {
  it('une nombres y apellidos y nombra el estado', () => {
    expect(nombreCompleto({ nombres: 'Ana', apellidos: 'Pérez' })).toBe('Ana Pérez');
    expect(nombreCompleto({ nombres: 'Ana', apellidos: '' })).toBe('Ana');
    expect(etiquetaEstadoUsuario(true)).toBe('Activa');
    expect(etiquetaEstadoUsuario(false)).toBe('Inactiva');
  });
});

describe('ultimoAcceso', () => {
  it('dice si nunca inició sesión, si la fecha no sirve, o cuándo fue', () => {
    expect(ultimoAcceso(null)).toBe('Nunca ha iniciado sesión');
    expect(ultimoAcceso('no es fecha')).toBe('Último acceso desconocido');
    expect(ultimoAcceso('2026-10-20T10:00:00.000Z')).toMatch(/^Último acceso: .*2026/);
  });
});