import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { PasswordChecklistComponent } from '@app/shared/components/password-checklist/password-checklist.component';
import { codigoDeError, mensajeDeError } from '@app/shared/utils/api-error';
import { passwordNueva } from '@app/shared/utils/password-rules';

type Estado = 'validando' | 'formulario' | 'exito' | 'invalido';

@Component({
    selector: 'app-reset-password',
    templateUrl: 'reset-password.page.html',
    imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent, PasswordChecklistComponent],
})
export class ResetPasswordPage {
    private readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(NonNullableFormBuilder);

    private token: string | null;

    readonly estado = signal<Estado>('validando');

    readonly form = this.fb.group({
        password: ['', [Validators.required, passwordNueva, Validators.maxLength(128)]],
    });
    readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });

    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);

    constructor() {
        this.token = this.route.snapshot.queryParamMap.get('token');

        // El token solo se queda en memoria: se quita de la barra de direcciones y del historial
        void this.router.navigate([], { queryParams: {}, replaceUrl: true });

        if (!this.token) {
            this.estado.set('invalido');
            return;
        }

        // Se avisa de un enlace vencido ANTES de que la persona escriba su contraseña nueva
        this.auth
            .validarRecuperacion(this.token)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.estado.set('formulario'),
                error: () => this.estado.set('invalido'),
            });
    }

    enviar(): void {
        this.error.set(null);

        if (this.form.invalid || !this.token) {
            this.form.markAllAsTouched();
            return;
        }

        this.cargando.set(true);
        const { password } = this.form.getRawValue();

        this.auth
            .restablecerPassword(this.token, password)
            .pipe(
                finalize(() => this.cargando.set(false)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.form.reset(); // la contraseña no debe quedarse en memoria
                    this.token = null;
                    this.estado.set('exito');
                },
                error: (error: unknown) => {
                    if (codigoDeError(error) === 'TOKEN_INVALIDO') {
                        this.estado.set('invalido');
                    } else {
                        this.error.set(mensajeDeError(error));
                    }
                },
            });
    }
}