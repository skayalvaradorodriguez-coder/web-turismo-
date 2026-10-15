import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '@app/core/services/auth.service';
import { rolGuard } from './roles.guard';

function ejecutar(rol: string | undefined) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { usuario: () => (rol ? { rol } : null) } },
    ],
  });
  const router = TestBed.inject(Router);
  const resultado = TestBed.runInInjectionContext(() =>
    rolGuard('super_admin', 'admin')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  return { resultado, router };
}

describe('rolGuard', () => {
  it('deja pasar a un rol permitido', () => {
    expect(ejecutar('admin').resultado).toBe(true);
  });

  it('un rol no permitido vuelve al inicio', () => {
    const { resultado, router } = ejecutar('externo');
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/home');
  });

  it('sin usuario tambien vuelve al inicio', () => {
    const { resultado, router } = ejecutar(undefined);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/home');
  });
});