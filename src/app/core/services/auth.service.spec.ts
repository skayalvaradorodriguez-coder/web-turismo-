import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '@app/core/config/api.config';
import type { Usuario } from '@app/core/models/api.models';
import { AuthService } from './auth.service';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const usuarioDePrueba = { id: 1, email: 'ana@correo.com' } as unknown as Usuario;

describe('AuthService', () => {
    let servicio: AuthService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        servicio = TestBed.inject(AuthService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('empieza sin sesion', () => {
        expect(servicio.usuario()).toBeNull();
        expect(servicio.autenticado()).toBe(false);
    });

    it('login correcto guarda el usuario y marca la sesion como iniciada', () => {
        let recibido: Usuario | undefined;
        servicio.login('ana@correo.com', 'ClaveSegura123').subscribe((u) => (recibido = u));

        const peticion = http.expectOne(`${API_URL}/auth/login`);
        expect(peticion.request.method).toBe('POST');
        expect(peticion.request.body).toEqual({ email: 'ana@correo.com', password: 'ClaveSegura123' });
        peticion.flush({ ok: true, data: { usuario: usuarioDePrueba } });

        expect(recibido).toEqual(usuarioDePrueba);
        expect(servicio.usuario()).toEqual(usuarioDePrueba);
        expect(servicio.autenticado()).toBe(true);
    });

    it('login con credenciales malas no crea sesion y propaga el error', () => {
        let estado: number | undefined;
        servicio.login('ana@correo.com', 'mala').subscribe({ error: (e) => (estado = e.status) });

        http.expectOne(`${API_URL}/auth/login`).flush(
            { ok: false },
            { status: 401, statusText: 'Unauthorized' },
        );

        expect(estado).toBe(401);
        expect(servicio.autenticado()).toBe(false);
    });

    it('logout limpia la sesion local aunque la API falle', () => {
        servicio.limpiarSesion();
        servicio.login('ana@correo.com', 'ClaveSegura123').subscribe();
        http.expectOne(`${API_URL}/auth/login`).flush({ ok: true, data: { usuario: usuarioDePrueba } });
        expect(servicio.autenticado()).toBe(true);

        servicio.logout().subscribe();
        http.expectOne(`${API_URL}/auth/logout`).flush('', { status: 500, statusText: 'Error' });

        expect(servicio.autenticado()).toBe(false);
    });

    it('restaurarSesion recupera el usuario si la cookie sigue valida', async () => {
        const promesa = servicio.restaurarSesion();
        http.expectOne(`${API_URL}/auth/me`).flush({ ok: true, data: { usuario: usuarioDePrueba } });
        await promesa;

        expect(servicio.usuario()).toEqual(usuarioDePrueba);
    });

    it('restaurarSesion no lanza error si no hay sesion (401)', async () => {
        const promesa = servicio.restaurarSesion();
        http.expectOne(`${API_URL}/auth/me`).flush('', { status: 401, statusText: 'Unauthorized' });
        await expect(promesa).resolves.toBeUndefined();

        expect(servicio.autenticado()).toBe(false);
    });

    it('googleNonce devuelve el nonce que entrega la API', () => {
        let nonce: string | undefined;
        servicio.googleNonce().subscribe((n) => (nonce = n));
        http.expectOne(`${API_URL}/auth/google/nonce`).flush({ ok: true, data: { nonce: 'abc123' } });

        expect(nonce).toBe('abc123');
    });

    it('limpiarSesion quita al usuario (lo usa el interceptor ante un 401)', () => {
        servicio.loginConGoogle('credencial').subscribe();
        http.expectOne(`${API_URL}/auth/google`).flush({ ok: true, data: { usuario: usuarioDePrueba } });
        expect(servicio.autenticado()).toBe(true);

        servicio.limpiarSesion();
        expect(servicio.autenticado()).toBe(false);
    });
});