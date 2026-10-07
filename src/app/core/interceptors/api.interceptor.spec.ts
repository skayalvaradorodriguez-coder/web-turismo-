import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '@app/core/config/api.config';
import { AuthService } from '@app/core/services/auth.service';
import { apiInterceptor } from './api.interceptor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('apiInterceptor', () => {
    let cliente: HttpClient;
    let http: HttpTestingController;
    let auth: AuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([apiInterceptor])),
                provideHttpClientTesting(),
            ],
        });
        cliente = TestBed.inject(HttpClient);
        http = TestBed.inject(HttpTestingController);
        auth = TestBed.inject(AuthService);
    });

    afterEach(() => http.verify());

    it('envia la cookie de sesion (withCredentials) a nuestra API', () => {
        cliente.get(`${API_URL}/cualquier-cosa`).subscribe();
        const peticion = http.expectOne(`${API_URL}/cualquier-cosa`);
        expect(peticion.request.withCredentials).toBe(true);
        peticion.flush({});
    });

    it('NO envia la cookie a otros sitios', () => {
        cliente.get('https://otro-sitio.example/datos').subscribe();
        const peticion = http.expectOne('https://otro-sitio.example/datos');
        expect(peticion.request.withCredentials).toBe(false);
        peticion.flush({});
    });

    it('ante un 401 en una ruta protegida limpia la sesion y propaga el error', () => {
        const limpiar = vi.spyOn(auth, 'limpiarSesion');
        let estado: number | undefined;

        cliente.get(`${API_URL}/lugares`).subscribe({ error: (e) => (estado = e.status) });
        http.expectOne(`${API_URL}/lugares`).flush('', { status: 401, statusText: 'Unauthorized' });

        expect(limpiar).toHaveBeenCalled();
        expect(estado).toBe(401);
    });

    it('un 401 en /auth/login es normal (credenciales malas): no toca la sesion', () => {
        const limpiar = vi.spyOn(auth, 'limpiarSesion');

        cliente.post(`${API_URL}/auth/login`, {}).subscribe({ error: () => undefined });
        http.expectOne(`${API_URL}/auth/login`).flush('', { status: 401, statusText: 'Unauthorized' });

        expect(limpiar).not.toHaveBeenCalled();
    });
});