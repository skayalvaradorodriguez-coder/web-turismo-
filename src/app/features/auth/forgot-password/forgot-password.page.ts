import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeDeError } from '@app/shared/utils/api-error';

const ESPERA_REENVIO_SEGUNDOS = 60;

@Component({
    selector: 'app-forgot-password',
    templateUrl: 'forgot-password.page.html',
    imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent],
})
export class ForgotPasswordPage {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly auth = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);

    readonly form = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    });

    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);
    readonly correoEnviado = signal<string | null>(null);

    readonly espera = signal(0);
    readonly reenviando = signal(false);
    readonly reenvioOk = signal(false);
    private temporizador: ReturnType<typeof setInterval> | undefined;

    constructor() {
        this.destroyRef.onDestroy(() => clearInterval(this.temporizador));
    }

    enviar(): void {
        this.error.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.cargando.set(true);
        const email = this.form.getRawValue().email.trim().toLowerCase();

        this.auth
            .solicitarRecuperacion(email)
            .pipe(
                finalize(() => this.cargando.set(false)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.correoEnviado.set(email);
                    this.iniciarEspera();
                },
                error: (error: unknown) => this.error.set(mensajeDeError(error)),
            });
    }

    reenviar(): void {
        const correo = this.correoEnviado();
        if (!correo || this.espera() > 0 || this.reenviando()) return;

        this.error.set(null);
        this.reenviando.set(true);
        this.auth
            .solicitarRecuperacion(correo)
            .pipe(
                finalize(() => this.reenviando.set(false)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.reenvioOk.set(true);
                    this.iniciarEspera();
                },
                error: (error: unknown) => this.error.set(mensajeDeError(error)),
            });
    }

    private iniciarEspera(): void {
        clearInterval(this.temporizador);
        this.espera.set(ESPERA_REENVIO_SEGUNDOS);
        this.temporizador = setInterval(() => {
            this.espera.update((s) => Math.max(0, s - 1));
            if (this.espera() === 0) clearInterval(this.temporizador);
        }, 1000);
    }
}