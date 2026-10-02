import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { finalize } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { mensajeDeError } from '@app/shared/utils/api-error';
import { destinoSeguro } from '@app/shared/utils/safe-url';

@Component({
    selector: 'app-login',
    templateUrl: 'login.page.html',
    styleUrls: ['login.page.scss'],
    imports: [ReactiveFormsModule, IonContent],
})
export class LoginPage {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    readonly form = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
        password: ['', [Validators.required, Validators.maxLength(128)]],
    });

    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);
    readonly intentado = signal(false);

    mostrarError(campo: 'email' | 'password'): boolean {
        const control = this.form.controls[campo];
        return control.invalid && (control.touched || this.intentado());
    }

    enviar(): void {
        this.intentado.set(true);
        this.error.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.cargando.set(true);
        const { email, password } = this.form.getRawValue();

        this.auth
            .login(email, password)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: () => {
                    // La pagina queda en memoria detras de la siguiente: no dejar la contrasena escrita
                    this.form.reset();
                    this.intentado.set(false);
                    void this.router.navigateByUrl(destinoSeguro(this.route.snapshot.queryParamMap.get('returnUrl')));
                },
                error: (error: unknown) => {
                    this.error.set(mensajeDeError(error));
                    this.form.controls.password.reset('');
                },
            });
    }
}