export type EstadoFuente = 'activa' | 'inactiva';

/** Lo que la API entrega de una fuente. Las fechas llegan como texto ISO. */
export interface Fuente {
  id: number;
  codigo: string;
  nombre: string;
  institucion: string;
  descripcion: string | null;
  tipoFuente: string | null;
  mecanismoAcceso: string | null;
  frecuenciaActualizacion: string | null;
  procedencia: string | null;
  licenciaUso: string | null;
  responsable: string | null;
  estado: EstadoFuente;
  creadoPor: number;
  creadaEn: string;
  actualizadaEn: string;
}

/** Campos que se pueden editar. Los opcionales vacios se guardan como null. */
export interface DatosFuente {
  nombre: string;
  institucion: string;
  descripcion?: string | null;
  tipoFuente?: string | null;
  mecanismoAcceso?: string | null;
  frecuenciaActualizacion?: string | null;
  procedencia?: string | null;
  licenciaUso?: string | null;
  responsable?: string | null;
}

/** El codigo solo se define al crear: despues no cambia. */
export interface DatosNuevaFuente extends DatosFuente {
  codigo: string;
}