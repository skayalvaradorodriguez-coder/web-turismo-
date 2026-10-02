/**
 * Devuelve una ruta interna segura para redirigir despues del login.
 * Evita "open redirect": un enlace como /login?returnUrl=//sitio-malo.com no debe sacar al usuario de la app.
 */
export function destinoSeguro(returnUrl: string | null | undefined, porDefecto = '/home'): string {
    if (!returnUrl) return porDefecto;

    const esInterna =
        returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//') &&
        !returnUrl.includes('\\') &&
        !/[\r\n]/.test(returnUrl) &&
        !returnUrl.startsWith('/login');

    return esInterna ? returnUrl : porDefecto;
}