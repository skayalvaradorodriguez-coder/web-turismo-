export type EstadoCarga = 'recibida' | 'validada' | 'procesada' | 'publicada' | 'rechazada';

/** Una carga tal como la entrega la API (fechas del periodo como AAAA-MM-DD, las demas en ISO). */
export interface Carga {
  id: number;
  fuenteId: number;
  estructuraId: number | null;
  descripcion: string | null;
  periodoDesde: string | null;
  periodoHasta: string | null;
  nivelIngreso: number;
  estado: EstadoCarga;
  motivoRechazo: string | null;
  cargadoPor: number;
  publicadaPor: number | null;
  publicadaEn: string | null;
  creadaEn: string;
  actualizadaEn: string;
}

export interface ArchivoOriginal {
  id: number;
  cargaId: number;
  nombreOriginal: string;
  nombreAlmacenado: string;
  tipoMime: string;
  tamanoBytes: number;
  sha256: string;
  version: number;
  vigente: boolean;
  subidoPor: number;
  creadoEn: string;
}

export interface Metadato {
  clave: string;
  valor: string;
}

export interface DetalleCarga {
  carga: Carga;
  archivos: ArchivoOriginal[];
  metadatos: Metadato[];
}

export interface PaginaCargas {
  cargas: Carga[];
  total: number;
  pagina: number;
  limite: number;
}

export interface FiltroCargas {
  fuenteId?: number | undefined;
  estado?: EstadoCarga | undefined;
  pagina?: number | undefined;
  limite?: number | undefined;
}