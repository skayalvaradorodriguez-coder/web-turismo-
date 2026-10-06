import { Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { finalize, firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import type { Usuario } from '@app/core/models/api.models';
import { AuthService } from '@app/core/services/auth.service';
import { GoogleId, GoogleIdentityService } from '@app/core/services/google-identity.service';
import { ThemeService } from '@app/core/services/theme.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeDeError } from '@app/shared/utils/api-error';

type Estado = 'sin-configurar' | 'cargando' | 'listo' | 'error';

/**
 * Boton oficial "Continuar con Google". Google dibuja el boton (por seguridad no se puede
 * reemplazar por uno propio) y entrega una credencial firmada que la API verifica.
 */
@Component({
    selector: 'app-google-button',
    imports: [IconComponent],
    template: `
    @switch (estado()) {
      @case ('sin-configurar') {
        <button type="button" class="btn btn--outline" disabled>
          <app-icon name="google" [size]="20" />
          <span>Continuar con Google</span>
          <span class="btn__tag">Pronto</span>
        </button>
      }
      @case ('error') {
        <button type="button" class="btn btn--outline" disabled>
          <app-icon name="google" [size]="20" />
          <span>Google no está disponible</span>
        </button>
        <button type="button" class="btn btn--link gbtn__reintentar" (click)="iniciar()">Reintentar</button>
      }
      @case ('cargando') {
        <div class="gbtn gbtn--esqueleto" role="status" aria-label="Cargando el acceso con Google"></div>
      }
    }

    <div
      #contenedor
      class="gbtn"
      [class.gbtn--oculto]="estado() !== 'listo'"
      [class.gbtn--procesando]="procesando()"
      [attr.aria-busy]="procesando()"
    ></div>
  `,
    styles: [':host { display: block; } .gbtn__reintentar { display: block; margin: 6px auto 0; }'],
})
export class GoogleButtonComponent {
    private readonly auth = inject(AuthService);
    private readonly gis = inject(GoogleIdentityService);
    private readonly tema = inject(ThemeService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');

    /** Texto del boton que dibuja Google. */
    readonly texto = input<'continue_with' | 'signup_with' | 'signin_with'>('continue_with');

    readonly iniciado = output<Usuario>();
    readonly fallo = output<string>();

    protected readonly estado = signal<Estado>(environment.googleClientId ? 'cargando' : 'sin-configurar');
    protected readonly procesando = signal(false);

    private gid: GoogleId | undefined;
    private destruido = false;

    constructor() {
        this.destroyRef.onDestroy(() => (this.destruido = true));
        afterNextRender(() => void this.iniciar());
        // Si cambia el modo claro/oscuro, el boton se vuelve a dibujar con los colores que corresponden
        effect(() => {
            this.tema.esOscuro();
            untracked(() => this.dibujar());
        });
    }

    protected async iniciar(): Promise<void> {
        if (!environment.googleClientId) return;
        this.estado.set('cargando');
        try {
            this.gid = await this.gis.cargar();
            await this.renovarNonce();
            this.dibujar();
            if (!this.destruido) this.estado.set('listo');
        } catch {
            if (!this.destruido) this.estado.set('error');
        }
    }

    /** Cada intento usa un nonce nuevo: la API borra el anterior despues de usarlo. */
    private async renovarNonce(): Promise<void> {
        const nonce = await firstValueFrom(this.auth.googleNonce());
        this.gid?.initialize({
            client_id: environment.googleClientId,
            callback: (respuesta) => this.alRecibir(respuesta.credential),
            nonce,
            ux_mode: 'popup',
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
        });
    }

    private dibujar(): void {
        const elemento = this.contenedor()?.nativeElement;
        if (!elemento || !this.gid) return;

        elemento.replaceChildren();
        this.gid.renderButton(elemento, {
            type: 'standard',
            theme: this.tema.esOscuro() ? 'filled_black' : 'outline',
            size: 'large',
            text: this.texto(),
            shape: 'rectangular',
            logo_alignment: 'center',
            width: Math.min(400, Math.floor(elemento.clientWidth) || 320),
            locale: 'es',
        });
    }

    private alRecibir(credencial: string): void {
        this.procesando.set(true);
        this.auth
            .loginConGoogle(credencial)
            .pipe(finalize(() => this.procesando.set(false)))
            .subscribe({
                next: (usuario) => this.iniciado.emit(usuario),
                error: (error: unknown) => {
                    this.fallo.emit(mensajeDeError(error));
                    void this.renovarNonce().catch(() => undefined); // el nonce anterior ya se gasto
                },
            });
    }
}