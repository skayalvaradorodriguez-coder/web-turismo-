import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeDeError } from '@app/shared/utils/api-error';

type Estado = 'cargando' | 'ok' | 'error';

@Component({
    selector: 'app-verify-email',
    templateUrl: 'verify-email.page.html',
    imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent],
})
export class VerifyEmailPage {
    private readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(NonNullableFormBuilder);

    readonly estado = signal<Estado>('cargando');

    readonly form = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    });
    readonly enviando = signal(false);
    readonly nuevoEnlaceEnviado = signal(false);
    readonly error = signal<string | null>(null);

    constructor() {
        const token = this.route.snapshot.queryParamMap.get('token');

        // El token se quita de la barra de direcciones: no queda en el historial ni se comparte por error
        void this.router.navigate([], { queryParams: {}, replaceUrl: true });

        if (!token) {
            this.estado.set('error');
            return;
        }

        this.auth
            .verificarEmail(token)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.estado.set('ok'),
                error: () => this.estado.set('error'),
            });
    }

    pedirNuevoEnlace(): void {
        this.error.set(null);
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.enviando.set(true);
        this.auth
            .reenviarVerificacion(this.form.getRawValue().email)
            .pipe(
                finalize(() => this.enviando.set(false)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => this.nuevoEnlaceEnviado.set(true),
                error: (error: unknown) => this.error.set(mensajeDeError(error)),
            });
    }
}