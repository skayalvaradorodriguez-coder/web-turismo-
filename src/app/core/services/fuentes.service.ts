import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk } from '@app/core/models/api.models';
import type { DatosFuente, DatosNuevaFuente, EstadoFuente, Fuente } from '@app/core/models/fuente.models';

@Injectable({ providedIn: 'root' })
export class FuentesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/fuentes`;

  listar(estado?: EstadoFuente): Observable<Fuente[]> {
    const params = estado ? new HttpParams().set('estado', estado) : undefined;
    return this.http
      .get<ApiOk<{ fuentes: Fuente[] }>>(this.base, { params })
      .pipe(map((respuesta) => respuesta.data.fuentes));
  }

  obtener(id: number): Observable<Fuente> {
    return this.http
      .get<ApiOk<{ fuente: Fuente }>>(`${this.base}/${id}`)
      .pipe(map((respuesta) => respuesta.data.fuente));
  }

  crear(datos: DatosNuevaFuente): Observable<Fuente> {
    return this.http
      .post<ApiOk<{ fuente: Fuente }>>(this.base, datos)
      .pipe(map((respuesta) => respuesta.data.fuente));
  }

  editar(id: number, datos: DatosFuente): Observable<Fuente> {
    return this.http
      .put<ApiOk<{ fuente: Fuente }>>(`${this.base}/${id}`, datos)
      .pipe(map((respuesta) => respuesta.data.fuente));
  }

  cambiarEstado(id: number, estado: EstadoFuente): Observable<Fuente> {
    return this.http
      .patch<ApiOk<{ fuente: Fuente }>>(`${this.base}/${id}/estado`, { estado })
      .pipe(map((respuesta) => respuesta.data.fuente));
  }
}