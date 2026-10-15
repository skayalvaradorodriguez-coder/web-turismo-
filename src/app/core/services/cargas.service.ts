import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { DetalleCarga, FiltroCargas, PaginaCargas } from '@app/core/models/carga.models';
import type { ApiOk } from '@app/core/models/api.models';

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
}