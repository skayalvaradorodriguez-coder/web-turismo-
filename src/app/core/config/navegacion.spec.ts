import { describe, expect, it } from 'vitest';
import { MENU, menuPara } from './navegacion';

const rutas = (rol: string | undefined) => menuPara(rol).map((i) => i.ruta);

describe('menuPara', () => {
  it('todos los roles ven Inicio', () => {
    for (const rol of ['super_admin', 'admin', 'investigador', 'externo']) {
      expect(rutas(rol)).toContain('/home');
    }
  });

  it('gestion e investigador ven Fuentes; externo no', () => {
    expect(rutas('super_admin')).toContain('/fuentes');
    expect(rutas('admin')).toContain('/fuentes');
    expect(rutas('investigador')).toContain('/fuentes');
    expect(rutas('externo')).not.toContain('/fuentes');
  });

  it('sin rol solo se ven las entradas sin restriccion', () => {
    const sinRestriccion = MENU.filter((i) => !i.roles).map((i) => i.ruta);
    expect(rutas(undefined)).toEqual(sinRestriccion);
  });

  it('un rol desconocido no ve entradas restringidas', () => {
    const restringidas = MENU.filter((i) => i.roles).map((i) => i.ruta);
    const vistas = rutas('inventado');
    for (const ruta of restringidas) expect(vistas).not.toContain(ruta);
  });
});

describe('menuPara (Cargas)', () => {
  it('gestion e investigador ven Cargas; externo no', () => {
    expect(rutas('super_admin')).toContain('/cargas');
    expect(rutas('admin')).toContain('/cargas');
    expect(rutas('investigador')).toContain('/cargas');
    expect(rutas('externo')).not.toContain('/cargas');
  });
});