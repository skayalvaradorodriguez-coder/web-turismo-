import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { detallesDeError, mensajeApi } from './api-error';

const error = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });

describe('mensajeApi', () => {
    it('usa el mensaje que envia la API', () => {
        expect(mensajeApi(error(403, { ok: false, message: 'No tienes permiso' }), 'por defecto')).toBe('No tienes permiso');
    });

    it('sin conexion avisa que no se pudo conectar', () => {
        expect(mensajeApi(error(0, null), 'por defecto')).toContain('conectar');
    });

    it('si no hay mensaje usa el texto por defecto', () => {
        expect(mensajeApi(error(500, {}), 'por defecto')).toBe('por defecto');
        expect(mensajeApi(new Error('x'), 'por defecto')).toBe('por defecto');
    });
});

describe('detallesDeError', () => {
    it('devuelve los errores por campo', () => {
        const detalles = [{ campo: 'nombre', mensaje: 'Muy corto' }];
        expect(detallesDeError(error(422, { ok: false, code: 'VALIDACION', details: detalles }))).toEqual(detalles);
    });

    it('sin detalles devuelve lista vacia', () => {
        expect(detallesDeError(error(422, { ok: false }))).toEqual([]);
        expect(detallesDeError(new Error('x'))).toEqual([]);
    });
});