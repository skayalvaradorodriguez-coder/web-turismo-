import type { EstadoFuente, Fuente } from '@app/core/models/fuente.models';

export type FiltroEstado = EstadoFuente | 'todas';

/** Minusculas y sin tildes, para que "ministerio" encuentre "Ministerio" y "turistica" encuentre "turística". */
const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Filtra por estado y por texto (nombre, institucion o codigo). Texto vacio: no filtra por texto. */
export function filtrarFuentes(fuentes: readonly Fuente[], texto: string, estado: FiltroEstado): Fuente[] {
  const buscado = normalizar(texto);
  return fuentes.filter((f) => {
    if (estado !== 'todas' && f.estado !== estado) return false;
    if (!buscado) return true;
    return normalizar(`${f.nombre} ${f.institucion} ${f.codigo}`).includes(buscado);
  });
}