import { describe, expect, it } from 'vitest';
import { MENU, menuPara } from './navegacion';

describe('menuPara', () => {
  it('todos los roles ven Inicio', () => {
    for (const rol of ['super_admin', 'admin', 'investigador', 'externo']) {
      expect(menuPara(rol).map((i) => i.ruta)).toContain('/home');
    }
  });

  it('sin rol solo se ven las entradas sin restriccion', () => {
    const sinRestriccion = MENU.filter((i) => !i.roles).map((i) => i.ruta);
    expect(menuPara(undefined).map((i) => i.ruta)).toEqual(sinRestriccion);
  });

  it('un rol desconocido no ve entradas restringidas', () => {
    const restringidas = MENU.filter((i) => i.roles).map((i) => i.ruta);
    const vistas = menuPara('inventado').map((i) => i.ruta);
    for (const ruta of restringidas) expect(vistas).not.toContain(ruta);
  });
});