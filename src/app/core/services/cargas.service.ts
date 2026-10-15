import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { DatosNuevaCarga, DetalleCarga, FiltroCargas, PaginaCargas } from '@app/core/models/carga.models';
import type { ApiOk } from '@app/core/models/api.models';

/** Lee un Blob como texto (FileReader funciona igual en el navegador y en las pruebas). */
function leerTexto(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsText(blob);
  });
}

@Injectable({ providedIn: 'root' })
export class CargasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/cargas`;

  listar(filtro: FiltroCargas = {}): Observable<PaginaCargas> {
    let params = new HttpParams();
    if (filtro.fuenteId !== undefined) params = params.set('fuenteId', filtro.fuenteId);
    if (filtro.estado !== undefined) params = params.set('estado', filtro.estado);
    if (filtro.pagina !== undefined) params = params.set('pagina', filtro.pagina);
    if (filtro.limite !== undefined) params = params.set('limite', filtro.limite);

    return this.http.get<ApiOk<PaginaCargas>>(this.url, { params }).pipe(map((respuesta) => respuesta.data));
  }

  obtener(id: number): Observable<DetalleCarga> {
    return this.http.get<ApiOk<DetalleCarga>>(`${this.url}/${id}`).pipe(map((respuesta) => respuesta.data));
  }

  /** Crea la carga enviando el archivo y los datos como formulario con archivo (multipart). */
  crear(datos: DatosNuevaCarga, archivo: File): Observable<DetalleCarga> {
    const cuerpo = new FormData();
    cuerpo.append('fuenteId', String(datos.fuenteId));
    if (datos.descripcion) cuerpo.append('descripcion', datos.descripcion);
    if (datos.periodoDesde) cuerpo.append('periodoDesde', datos.periodoDesde);
    if (datos.periodoHasta) cuerpo.append('periodoHasta', datos.periodoHasta);
    if (datos.metadatos && Object.keys(datos.metadatos).length > 0) {
      cuerpo.append('metadatos', JSON.stringify(datos.metadatos));
    }
    cuerpo.append('archivo', archivo, archivo.name);

    return this.http.post<ApiOk<DetalleCarga>>(this.url, cuerpo).pipe(map((respuesta) => respuesta.data));
  }

  rechazar(id: number, motivo: string): Observable<DetalleCarga> {
    return this.http
      .post<ApiOk<DetalleCarga>>(`${this.url}/${id}/rechazo`, { motivo })
      .pipe(map((respuesta) => respuesta.data));
  }

  /**
   * Descarga el archivo original. Si la API responde con error, el cuerpo llega como Blob:
   * se convierte de nuevo a JSON para que el mensaje de la API se pueda mostrar.
   */
  descargar(id: number, archivoId: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/archivos/${archivoId}/descarga`, { responseType: 'blob' }).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
          return from(leerTexto(error.error)).pipe(
            map((texto) => {
              try {
                return JSON.parse(texto) as unknown;
              } catch {
                return null;
              }
            }),
            switchMap((cuerpo) =>
              throwError(() => new HttpErrorResponse({ error: cuerpo, status: error.status, statusText: error.statusText })),
            ),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}