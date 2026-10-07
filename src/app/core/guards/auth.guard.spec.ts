import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { authGuard, guestGuard } from './auth.guard';
import { describe, expect, it } from 'vitest';

function ejecutar(guard: typeof authGuard, autenticado: boolean, url = '/privado') {
    TestBed.configureTestingModule({
        providers: [provideRouter([]), { provide: AuthService, useValue: { autenticado: () => autenticado } }],
    });
    const router = TestBed.inject(Router);
    const resultado = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    return { resultado, router };
}

describe('authGuard', () => {
    it('deja pasar si hay sesion', () => {
        const { resultado } = ejecutar(authGuard, true);
        expect(resultado).toBe(true);
    });

    it('sin sesion redirige a /login recordando a donde queria ir', () => {
        const { resultado, router } = ejecutar(authGuard, false, '/privado');
        expect(resultado).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(resultado as UrlTree)).toBe('/login?returnUrl=%2Fprivado');
    });
});

describe('guestGuard', () => {
    it('deja ver el login si no hay sesion', () => {
        const { resultado } = ejecutar(guestGuard, false);
        expect(resultado).toBe(true);
    });

    it('con sesion iniciada lleva a /home', () => {
        const { resultado, router } = ejecutar(guestGuard, true);
        expect(router.serializeUrl(resultado as UrlTree)).toBe('/home');
    });
});