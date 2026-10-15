import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorBody } from '@app/core/models/api.models';

const MENSAJES: Record<string, string> = {
    CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos, o la cuenta está bloqueada temporalmente.',
    CUENTA_INACTIVA: 'Tu cuenta está desactivada. Contacta al administrador.',
    EMAIL_NO_VERIFICADO: 'Debes verificar tu correo antes de iniciar sesión.',
    DEMASIADOS_INTENTOS: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    VALIDACION: 'Revisa los datos ingresados e inténtalo de nuevo.',
    SESION_INVALIDA: 'Tu sesión expiró. Inicia sesión de nuevo.',
    NO_AUTENTICADO: 'Debes iniciar sesión.',
    TOKEN_INVALIDO: 'El enlace no es válido, expiró o ya fue usado.',
    GOOGLE_INVALIDO: 'No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.',
    GOOGLE_CUENTA_DISTINTA: 'Este correo ya está vinculado a otra cuenta de Google.',
    GOOGLE_NO_CONFIGURADO: 'El acceso con Google no está disponible por ahora.',
};

/** Convierte cualquier error de la API en un mensaje claro para el usuario. */
export function mensajeDeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
        return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    }

    if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
    }

    const cuerpo = error.error as Partial<ApiErrorBody> | null;
    const codigo = cuerpo?.code;
    if (codigo && MENSAJES[codigo]) return MENSAJES[codigo];

    if (error.status >= 500) {
        return 'El servidor tuvo un problema. Inténtalo más tarde.';
    }
    return 'No se pudo completar la solicitud. Inténtalo de nuevo.';
}

/** Código de error de la API (por ejemplo EMAIL_NO_VERIFICADO), o null si no es un error de la API. */
export function codigoDeError(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) return null;
    const cuerpo = error.error as Partial<ApiErrorBody> | null;
    return cuerpo?.code ?? null;
}

/** Mensaje que la API envia en su cuerpo (ya viene en español), o el texto por defecto. */
export function mensajeApi(error: unknown, porDefecto: string): string {
    if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
            return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
        }
        const mensaje = (error.error as Partial<ApiErrorBody> | null)?.message;
        if (typeof mensaje === 'string' && mensaje.trim()) return mensaje;
    }
    return porDefecto;
}

/** Errores por campo que devuelve la API al validar (código VALIDACION), o lista vacía. */
export function detallesDeError(error: unknown): { campo: string; mensaje: string }[] {
    if (!(error instanceof HttpErrorResponse)) return [];
    const detalles = (error.error as Partial<ApiErrorBody> | null)?.details;
    return Array.isArray(detalles) ? detalles : [];
}