import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import { AuthService } from '@app/core/services/auth.service';

// En estas rutas un 401 es una respuesta normal (credenciales malas, sin sesion): no hay que redirigir
const RUTAS_AUTH = ['/auth/login', '/auth/me', '/auth/logout', '/auth/google', '/auth/google/nonce'];
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
    // Solo se tocan las peticiones a NUESTRA API; la cookie nunca se envia a otros sitios
    if (!req.url.startsWith(API_URL)) return next(req);

    const auth = inject(AuthService);
    const router = inject(Router);

    return next(req.clone({ withCredentials: true })).pipe(
        catchError((error: unknown) => {
            const sesionExpirada =
                error instanceof HttpErrorResponse &&
                error.status === 401 &&
                !RUTAS_AUTH.some((ruta) => req.url.endsWith(ruta));

            if (sesionExpirada) {
                auth.limpiarSesion();
                if (!router.url.startsWith('/login')) {
                    void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
                }
            }
            return throwError(() => error);
        }),
    );
};