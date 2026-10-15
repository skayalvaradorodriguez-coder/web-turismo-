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
 * (Fuentes, Cargas y Usuarios llegan en los siguientes pasos).
 */
export const MENU: readonly ItemMenu[] = [
  { etiqueta: 'Inicio', ruta: '/home', icono: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
];

/** Entradas del menu que puede ver un rol. Un rol desconocido solo ve las entradas sin restriccion. */
export function menuPara(rol: string | undefined): ItemMenu[] {
  return MENU.filter((item) => !item.roles || (rol !== undefined && item.roles.includes(rol)));
}

export { ROLES_CONSULTA, ROLES_GESTION };