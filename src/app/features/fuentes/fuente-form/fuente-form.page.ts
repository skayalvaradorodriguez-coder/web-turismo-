import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FuentesService } from '@app/core/services/fuentes.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { detallesDeError, mensajeApi } from '@app/shared/utils/api-error';

/** Mensajes de pantalla por campo (las mismas reglas que valida la API). */
const MENSAJES_CAMPO = {
  codigo: {
    required: 'Ingresa un código',
    minlength: 'Mínimo 3 caracteres',
    maxlength: 'Máximo 40 caracteres',
    pattern: 'Solo minúsculas, números y guion bajo, y debe empezar con una letra',
  },
  nombre: { required: 'Ingresa el nombre', minlength: 'Mínimo 3 caracteres', maxlength: 'Máximo 150 caracteres' },
  institucion: { required: 'Ingresa la institución', minlength: 'Mínimo 2 caracteres', maxlength: 'Máximo 150 caracteres' },
  descripcion: { maxlength: 'Máximo 2000 caracteres' },
  tipoFuente: { maxlength: 'Máximo 40 caracteres' },
  mecanismoAcceso: { maxlength: 'Máximo 40 caracteres' },
  frecuenciaActualizacion: { maxlength: 'Máximo 60 caracteres' },
  procedencia: { maxlength: 'Máximo 2000 caracteres' },
  licenciaUso: { maxlength: 'Máximo 200 caracteres' },
  responsable: { maxlength: 'Máximo 150 caracteres' },
} as const;

type Campo = keyof typeof MENSAJES_CAMPO;

@Component({
  selector: 'app-fuente-form',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent],
  templateUrl: './fuente-form.page.html',
  styleUrl: './fuente-form.page.scss',
})
export class FuenteFormPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(FuentesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Id de la fuente que se edita, o null si se esta creando una nueva. */
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  protected readonly editando = this.id !== null;

  readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40), Validators.pattern(/^[a-z][a-z0-9_]*$/)]],
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    institucion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(2000)]],
    tipoFuente: ['', [Validators.maxLength(40)]],
    mecanismoAcceso: ['', [Validators.maxLength(40)]],
    frecuenciaActualizacion: ['', [Validators.maxLength(60)]],
    procedencia: ['', [Validators.maxLength(2000)]],
    licenciaUso: ['', [Validators.maxLength(200)]],
    responsable: ['', [Validators.maxLength(150)]],
  });

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  private readonly erroresServidor = signal<Record<string, string>>({});

  /** Mensajes por campo, mas el que haya devuelto la API para ese campo. */
  protected readonly mensajes = computed(() => {
    const servidor = this.erroresServidor();
    const resultado = {} as Record<Campo, Record<string, string>>;
    for (const campo of Object.keys(MENSAJES_CAMPO) as Campo[]) {
      resultado[campo] = { ...MENSAJES_CAMPO[campo], servidor: servidor[campo] ?? 'Revisa este campo' };
    }
    return resultado;
  });

  ngOnInit(): void {
    if (this.id === null) return;

    this.form.controls.codigo.disable(); // el codigo no cambia despues de crear la fuente
    this.cargando.set(true);
    this.api
      .obtener(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (f) => {
          this.form.patchValue({
            codigo: f.codigo,
            nombre: f.nombre,
            institucion: f.institucion,
            descripcion: f.descripcion ?? '',
            tipoFuente: f.tipoFuente ?? '',
            mecanismoAcceso: f.mecanismoAcceso ?? '',
            frecuenciaActualizacion: f.frecuenciaActualizacion ?? '',
            procedencia: f.procedencia ?? '',
            licenciaUso: f.licenciaUso ?? '',
            responsable: f.responsable ?? '',
          });
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.errorCarga.set(mensajeApi(e, 'No se pudo cargar la fuente.'));
          this.cargando.set(false);
        },
      });
  }

  enviar(): void {
    this.error.set(null);
    this.erroresServidor.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { codigo, ...resto } = this.form.getRawValue();
    const datos = Object.fromEntries(Object.entries(resto).map(([clave, valor]) => [clave, valor.trim()])) as typeof resto;

    const peticion = this.id === null ? this.api.crear({ codigo: codigo.trim(), ...datos }) : this.api.editar(this.id, datos);

    this.guardando.set(true);
    peticion
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const aviso = this.id === null ? 'Fuente creada correctamente.' : 'Fuente actualizada correctamente.';
          void this.router.navigateByUrl('/fuentes', { state: { aviso } });
        },
        error: (e: unknown) => {
          if (this.marcarErroresDeCampos(e)) {
            this.error.set('Revisa los campos marcados.');
          } else {
            this.error.set(mensajeApi(e, 'No se pudo guardar la fuente. Inténtalo de nuevo.'));
          }
        },
      });
  }

  /** Pone el mensaje de la API debajo de cada campo con error. Devuelve true si habia alguno. */
  private marcarErroresDeCampos(error: unknown): boolean {
    const porCampo: Record<string, string> = {};
    for (const detalle of detallesDeError(error)) {
      const control = this.form.get(detalle.campo);
      if (!control) continue;
      control.setErrors({ servidor: true });
      control.markAsTouched();
      porCampo[detalle.campo] = detalle.mensaje;
    }
    this.erroresServidor.set(porCampo);
    return Object.keys(porCampo).length > 0;
  }
}