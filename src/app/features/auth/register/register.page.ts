import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { GoogleButtonComponent } from '@app/shared/components/google-button/google-button.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { PasswordChecklistComponent } from '@app/shared/components/password-checklist/password-checklist.component';
import { mensajeDeError } from '@app/shared/utils/api-error';
import { passwordNueva } from '@app/shared/utils/password-rules';

const ESPERA_REENVIO_SEGUNDOS = 60;
// Mismo patron que valida la API: letras (con tildes), espacios, apostrofes, puntos y guiones
const PATRON_NOMBRE = /^\p{L}[\p{L}\s'.-]*$/u;

@Component({
    selector: 'app-register',
    templateUrl: 'register.page.html',
    imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent, PasswordChecklistComponent, GoogleButtonComponent],
})
export class RegisterPage {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly auth = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);

    readonly form = this.fb.group({
        nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(PATRON_NOMBRE)]],
        apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(PATRON_NOMBRE)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
        password: ['', [Validators.required, passwordNueva, Validators.maxLength(128)]],
    });

    // Para que la lista de requisitos se actualice mientras se escribe
    readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });

    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);
    readonly correoEnviado = signal<string | null>(null);
    readonly errorGoogle = signal<string | null>(null);

    readonly espera = signal(0);
    readonly reenviando = signal(false);
    readonly reenvioOk = signal(false);
    private temporizador: ReturnType<typeof setInterval> | undefined;

    constructor() {
        this.destroyRef.onDestroy(() => clearInterval(this.temporizador));
    }

    /** Con Google la cuenta se crea y la sesion se abre en un solo paso (no hace falta verificar el correo). */
    alIniciarConGoogle(): void {
        this.errorGoogle.set(null);
        void this.router.navigateByUrl('/home');
    }

    enviar(): void {
        this.error.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.cargando.set(true);
        const datos = this.form.getRawValue();

        this.auth
            .registrar(datos)
            .pipe(
                finalize(() => this.cargando.set(false)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.correoEnviado.set(datos.email.trim().toLowerCase());
                    this.form.reset(); // la contraseña no debe quedarse en memoria
                    this.iniciarEspera();
                },
                error: (error: unknown) => this.error.set(mensajeDeError(error)),
            });
    }

    reenviar(): void {
        const correo = this.correoEnviado();
        if (!correo || this.espera() > 0 || this.reenviando()) return;

        this.reenviando.set(true);
        this.auth
            .reenviarVerificacion(correo)
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