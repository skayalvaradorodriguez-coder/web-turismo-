/** Roles que se pueden asignar desde la plataforma (super_admin no: esa cuenta no se toca desde aqui). */
export type RolAsignable = 'admin' | 'investigador' | 'externo';

export type EstadoUsuario = 'activa' | 'inactiva';

/** Una cuenta tal como la entrega la API a quien gestiona usuarios (sin contrasenas ni datos de Google). */
export interface UsuarioGestion {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
  ultimoLoginEn: string | null;
  creadoEn: string;
}

export interface PaginaUsuarios {
  usuarios: UsuarioGestion[];
  total: number;
  pagina: number;
  limite: number;
}

export interface FiltroUsuarios {
  rol?: string | undefined;
  estado?: EstadoUsuario | undefined;
  texto?: string | undefined;
  pagina?: number | undefined;
  limite?: number | undefined;
}