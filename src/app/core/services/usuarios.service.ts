import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk } from '@app/core/models/api.models';
import type {
  EstadoUsuario,
  FiltroUsuarios,
  PaginaUsuarios,
  RolAsignable,
  UsuarioGestion,
} from '@app/core/models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/usuarios`;

  listar(filtro: FiltroUsuarios = {}): Observable<PaginaUsuarios> {
    let params = new HttpParams();
    if (filtro.rol !== undefined) params = params.set('rol', filtro.rol);
    if (filtro.estado !== undefined) params = params.set('estado', filtro.estado);
    if (filtro.texto !== undefined) params = params.set('texto', filtro.texto);
    if (filtro.pagina !== undefined) params = params.set('pagina', filtro.pagina);
    if (filtro.limite !== undefined) params = params.set('limite', filtro.limite);

    return this.http.get<ApiOk<PaginaUsuarios>>(this.url, { params }).pipe(map((respuesta) => respuesta.data));
  }

  cambiarRol(id: number, rol: RolAsignable): Observable<UsuarioGestion> {
    return this.http
      .patch<ApiOk<{ usuario: UsuarioGestion }>>(`${this.url}/${id}/rol`, { rol })
      .pipe(map((respuesta) => respuesta.data.usuario));
  }

  /** Desactivar cierra las sesiones de la cuenta; reactivarla no las revive. */
  cambiarEstado(id: number, estado: EstadoUsuario): Observable<UsuarioGestion> {
    return this.http
      .patch<ApiOk<{ usuario: UsuarioGestion }>>(`${this.url}/${id}/estado`, { estado })
      .pipe(map((respuesta) => respuesta.data.usuario));
  }
}