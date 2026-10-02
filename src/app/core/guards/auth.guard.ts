import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

/** Protege rutas: sin sesion, lleva a /login recordando a donde queria ir. */
export const authGuard: CanActivateFn = (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.autenticado()
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Para /login: si ya hay sesion, no tiene sentido mostrar el formulario. */
export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.autenticado() ? router.createUrlTree(['/home']) : true;
};