import { ROLES_CONSULTA, ROLES_GESTION } from './roles';

export interface ItemMenu {
  etiqueta: string;
  ruta: string;
  /** Trazo SVG (viewBox 24x24) del icono. */
  icono: string;
  /** Roles que ven la entrada. Sin roles: la ven todos los usuarios con sesion. */
  roles?: readonly string[];
}

/**
 * Entradas del menu lateral. Se agregan aqui a medida que existe cada pantalla
 * (Usuarios llega en un paso posterior).
 */
export const MENU: readonly ItemMenu[] = [
  { etiqueta: 'Inicio', ruta: '/home', icono: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  {
    etiqueta: 'Fuentes',
    ruta: '/fuentes',
    icono: 'M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    roles: ROLES_CONSULTA,
  },
  {
    etiqueta: 'Cargas',
    ruta: '/cargas',
    icono: 'M12 3v12M7 8l5-5 5 5M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4',
    roles: ROLES_CONSULTA,
  },
];

/** Entradas del menu que puede ver un rol. Un rol desconocido solo ve las entradas sin restriccion. */
export function menuPara(rol: string | undefined): ItemMenu[] {
  return MENU.filter((item) => !item.roles || (rol !== undefined && item.roles.includes(rol)));
}

export { ROLES_CONSULTA, ROLES_GESTION };