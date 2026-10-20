import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk } from '@app/core/models/api.models';
import type {
  FiltroHallazgos,
  PaginaHallazgos,
  Procesamiento,
  ResultadoProcesamiento,
} from '@app/core/models/procesamiento.models';

@Injectable({ providedIn: 'root' })
export class ProcesamientoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/cargas`;

  /** Revisa el archivo sin guardar registros. Solo gestion. No lleva cuerpo: todo sale de la carga guardada. */
  validar(cargaId: number): Observable<ResultadoProcesamiento> {
    return this.http
      .post<ApiOk<ResultadoProcesamiento>>(`${this.url}/${cargaId}/validar`, null)
      .pipe(map((respuesta) => respuesta.data));
  }

  /** Guarda los registros y pasa la carga a procesada. Solo gestion. */
  procesar(cargaId: number): Observable<ResultadoProcesamiento> {
    return this.http
      .post<ApiOk<ResultadoProcesamiento>>(`${this.url}/${cargaId}/procesar`, null)
      .pipe(map((respuesta) => respuesta.data));
  }

  /** Historial de ejecuciones de la carga. */
  listar(cargaId: number): Observable<Procesamiento[]> {
    return this.http
      .get<ApiOk<{ procesamientos: Procesamiento[] }>>(`${this.url}/${cargaId}/procesamientos`)
      .pipe(map((respuesta) => respuesta.data.procesamientos));
  }

  hallazgos(cargaId: number, procesamientoId: number, filtro: FiltroHallazgos = {}): Observable<PaginaHallazgos> {
    let params = new HttpParams();
    if (filtro.severidad !== undefined) params = params.set('severidad', filtro.severidad);
    if (filtro.regla !== undefined) params = params.set('regla', filtro.regla);
    if (filtro.pagina !== undefined) params = params.set('pagina', filtro.pagina);
    if (filtro.limite !== undefined) params = params.set('limite', filtro.limite);

    return this.http
      .get<ApiOk<PaginaHallazgos>>(`${this.url}/${cargaId}/procesamientos/${procesamientoId}/hallazgos`, { params })
      .pipe(map((respuesta) => respuesta.data));
  }
}