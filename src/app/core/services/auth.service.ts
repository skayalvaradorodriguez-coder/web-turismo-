import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, firstValueFrom, map, Observable, of, tap, timeout } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk, Usuario } from '@app/core/models/api.models';

export interface DatosRegistro {
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly _usuario = signal<Usuario | null>(null);

    /** Usuario con sesion iniciada, o null. Solo lectura desde fuera del servicio. */
    readonly usuario = this._usuario.asReadonly();
    readonly autenticado = computed(() => this._usuario() !== null);

    login(email: string, password: string): Observable<Usuario> {
        return this.http
            .post<ApiOk<{ usuario: Usuario }>>(`${API_URL}/auth/login`, { email, password })
            .pipe(
                map((respuesta) => respuesta.data.usuario),
                tap((usuario) => this._usuario.set(usuario)),
            );
    }

    /** Crea la cuenta. La API responde igual exista o no el correo, por eso no devuelve datos. */
    registrar(datos: DatosRegistro): Observable<void> {
        return this.http.post<unknown>(`${API_URL}/auth/registro`, datos).pipe(map(() => undefined));
    }

    verificarEmail(token: string): Observable<void> {
        return this.http.post<unknown>(`${API_URL}/auth/verificar-email`, { token }).pipe(map(() => undefined));
    }

    reenviarVerificacion(email: string): Observable<void> {
        return this.http.post<unknown>(`${API_URL}/auth/reenviar-verificacion`, { email }).pipe(map(() => undefined));
    }

    /** Cierra la sesion en la API y SIEMPRE limpia la sesion local, aunque la API falle. */
    logout(): Observable<void> {
        return this.http.post<unknown>(`${API_URL}/auth/logout`, {}).pipe(
            map(() => undefined),
            catchError(() => of(undefined)),
            finalize(() => this._usuario.set(null)),
        );
    }

    /**
     * Se ejecuta una vez al iniciar la app: pregunta a la API si la cookie de sesion sigue valida.
     * Nunca lanza error: si la API no responde o no hay sesion, simplemente queda sin usuario.
     */
    async restaurarSesion(): Promise<void> {
        try {
            const respuesta = await firstValueFrom(
                this.http.get<ApiOk<{ usuario: Usuario }>>(`${API_URL}/auth/me`).pipe(timeout(5000)),
            );
            this._usuario.set(respuesta.data.usuario);
        } catch {
            this._usuario.set(null);
        }
    }

    /** Para el interceptor: la API dijo 401, la sesion ya no es valida. */
    limpiarSesion(): void {
        this._usuario.set(null);
    }
}