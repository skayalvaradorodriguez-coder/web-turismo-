import type { EstadoCarga } from './carga.models';

export type TipoProcesamiento = 'validacion' | 'procesamiento';
export type EstadoProcesamiento = 'en_curso' | 'completado' | 'fallido';
export type SeveridadHallazgo = 'error' | 'alerta';

/** Una ejecucion de validacion o de procesamiento sobre una carga. */
export interface Procesamiento {
  id: number;
  cargaId: number;
  archivoId: number;
  tipo: TipoProcesamiento;
  estado: EstadoProcesamiento;
  totalFilas: number;
  totalErrores: number;
  totalAlertas: number;
  mensajeError: string | null;
  ejecutadoPor: number;
  iniciadoEn: string;
  finalizadoEn: string | null;
}

/** Un problema (error) o aviso (alerta) encontrado en una fila o en el archivo completo. */
export interface Hallazgo {
  id: number;
  procesamientoId: number;
  /** Numero de fila de datos (la primera despues del encabezado es la 1); null si es del archivo completo. */
  fila: number | null;
  columna: string | null;
  regla: string;
  severidad: SeveridadHallazgo;
  mensaje: string;
  valorOriginal: string | null;
  valorCorregido: string | null;
}

export interface ResumenHallazgo {
  regla: string;
  severidad: SeveridadHallazgo;
  total: number;
}

/** Respuesta de validar y de procesar. */
export interface ResultadoProcesamiento {
  procesamiento: Procesamiento;
  resumen: ResumenHallazgo[];
  estadoCarga: EstadoCarga;
}

export interface PaginaHallazgos {
  hallazgos: Hallazgo[];
  total: number;
  resumen: ResumenHallazgo[];
  pagina: number;
  limite: number;
}

export interface FiltroHallazgos {
  severidad?: SeveridadHallazgo | undefined;
  regla?: string | undefined;
  pagina?: number | undefined;
  limite?: number | undefined;
}