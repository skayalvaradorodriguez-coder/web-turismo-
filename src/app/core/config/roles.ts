/** Roles de la plataforma (los mismos que define la API). */
export const ROLES_GESTION: readonly string[] = ['super_admin', 'admin'];
export const ROLES_CONSULTA: readonly string[] = [...ROLES_GESTION, 'investigador'];

export const ETIQUETA_ROL: Readonly<Record<string, string>> = {
  super_admin: 'Super administrador',
  admin: 'Administrador',
  investigador: 'Investigador',
  externo: 'Externo',
};