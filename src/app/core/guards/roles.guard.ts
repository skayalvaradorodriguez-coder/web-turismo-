import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Deja entrar solo a los roles indicados; a los demas los lleva al inicio.
 * Es una comodidad de pantalla: quien manda es la API, que responde 403 sin permiso.
 */
export const rolGuard =
  (...roles: readonly string[]): CanActivateFn =>
  () => {
    const rol = inject(AuthService).usuario()?.rol;
    return rol !== undefined && roles.includes(rol) ? true : inject(Router).createUrlTree(['/home']);
  };