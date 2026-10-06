import { Injectable } from '@angular/core';

/** Lo minimo de "Google Identity Services" que usa la aplicacion. */
export interface GoogleId {
    initialize(config: {
        client_id: string;
        callback: (respuesta: { credential: string }) => void;
        nonce?: string;
        ux_mode?: 'popup';
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        itp_support?: boolean;
    }): void;
    renderButton(
        elemento: HTMLElement,
        opciones: {
            type?: 'standard';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill';
            logo_alignment?: 'left' | 'center';
            width?: number;
            locale?: string;
        },
    ): void;
}

type VentanaGoogle = Window & { google?: { accounts?: { id?: GoogleId } } };

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

/** Carga el script oficial de Google una sola vez, solo cuando hace falta. */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
    private promesa: Promise<GoogleId> | undefined;

    cargar(): Promise<GoogleId> {
        this.promesa ??= new Promise<GoogleId>((resolver, rechazar) => {
            const ventana = window as VentanaGoogle;
            const listo = ventana.google?.accounts?.id;
            if (listo) return resolver(listo);

            const script = document.createElement('script');
            script.src = URL_SCRIPT;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                const id = ventana.google?.accounts?.id;
                if (id) resolver(id);
                else rechazar(new Error('Google no respondio'));
            };
            script.onerror = () => {
                script.remove();
                this.promesa = undefined; // permite reintentar
                rechazar(new Error('No se pudo cargar Google'));
            };
            document.head.appendChild(script);
        });
        return this.promesa;
    }
}