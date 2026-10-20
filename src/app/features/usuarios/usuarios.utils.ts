import type { RolAsignable, UsuarioGestion } from '@app/core/models/usuario.models';
import { formatearFechaHora } from '../cargas/procesamiento-carga/procesamiento.utils';

const ASIGNABLES: readonly RolAsignable[] = ['admin', 'investigador', 'externo'];

export interface Permisos {
  /** Roles a los que se puede pasar esta cuenta (vacio si no se puede cambiar su rol). */
  rolesDisponibles: RolAsignable[];
  puedeCambiarEstado: boolean;
}

const NINGUNO: Permisos = { rolesDisponibles: [], puedeCambiarEstado: false };

/**
 * Lo que quien actua puede hacer con una cuenta. Repite las reglas de la API solo para no mostrar botones
 * que terminarian en error; la API es la que de verdad las hace cumplir.
 *  - Nadie modifica su propia cuenta ni la de un super administrador.
 *  - El super administrador puede asignar cualquier rol asignable y activar o desactivar a cualquiera.
 *  - El administrador solo mueve entre externo e investigador, y no toca cuentas de otros administradores.
 */
export function permisosSobre(actor: { id: number; rol: string }, objetivo: Pick<UsuarioGestion, 'id' | 'rol'>): Permisos {
  if (actor.id === objetivo.id || objetivo.rol === 'super_admin') return NINGUNO;

  if (actor.rol === 'super_admin') {
    return { rolesDisponibles: ASIGNABLES.filter((r) => r !== objetivo.rol), puedeCambiarEstado: true };
  }

  if (actor.rol === 'admin') {
    if (objetivo.rol === 'admin') return NINGUNO;
    const alcance: readonly RolAsignable[] = ['investigador', 'externo'];
    return { rolesDisponibles: alcance.filter((r) => r !== objetivo.rol), puedeCambiarEstado: true };
  }

  return NINGUNO;
}

export function nombreCompleto(usuario: Pick<UsuarioGestion, 'nombres' | 'apellidos'>): string {
  return `${usuario.nombres} ${usuario.apellidos}`.trim();
}

export function etiquetaEstadoUsuario(activo: boolean): string {
  return activo ? 'Activa' : 'Inactiva';
}

export function ultimoAcceso(iso: string | null): string {
  if (iso === null) return 'Nunca ha iniciado sesión';
  const fecha = formatearFechaHora(iso);
  return fecha === '' ? 'Último acceso desconocido' : `Último acceso: ${fecha}`;
}