import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { Fuente } from '@app/core/models/fuente.models';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { detallesDeError, mensajeApi } from '@app/shared/utils/api-error';
import { EXTENSIONES_PERMITIDAS, esArchivoPermitido, formatearTamano } from '../cargas.utils';

const MAX_METADATOS = 50;
// misma regla que la API: empieza con letra o numero; luego letras, numeros, espacio, _ . -
const PATRON_NOMBRE_METADATO = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u;

type GrupoMetadato = FormGroup<{ clave: FormControl<string>; valor: FormControl<string> }>;

/** Una fila de metadato debe tener nombre y valor, o estar vacia (se ignora). */
function parCompleto(grupo: AbstractControl): ValidationErrors | null {
  const clave = String(grupo.get('clave')?.value ?? '').trim();
  const valor = String(grupo.get('valor')?.value ?? '').trim();
  return (clave === '') !== (valor === '') ? { incompleto: true } : null;
}

function sinNombresRepetidos(lista: AbstractControl): ValidationErrors | null {
  const nombres = (lista as FormArray)
    .controls.map((fila) => String(fila.get('clave')?.value ?? '').trim().toLowerCase())
    .filter((nombre) => nombre !== '');
  return new Set(nombres).size === nombres.length ? null : { repetidos: true };
}

function periodoCoherente(grupo: AbstractControl): ValidationErrors | null {
  const desde = String(grupo.get('periodoDesde')?.value ?? '');
  const hasta = String(grupo.get('periodoHasta')?.value ?? '');
  return desde && hasta && hasta < desde ? { periodoInvertido: true } : null;
}

@Component({
  selector: 'app-carga-form',
  imports: [ReactiveFormsModule, RouterLink, FieldComponent, IconComponent],
  templateUrl: './carga-form.page.html',
  styleUrl: './carga-form.page.scss',
})
export class CargaFormPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly fuentesApi = inject(FuentesService);
  private readonly cargasApi = inject(CargasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly metadatos = this.fb.array<GrupoMetadato>([], { validators: [sinNombresRepetidos] });

  readonly form = this.fb.group(
    {
      fuenteId: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(2000)]],
      periodoDesde: [''],
      periodoHasta: [''],
      metadatos: this.metadatos,
    },
    { validators: [periodoCoherente] },
  );

  protected readonly fuentes = signal<Fuente[]>([]);
  protected readonly cargandoFuentes = signal(true);
  protected readonly errorFuentes = signal<string | null>(null);

  protected readonly archivo = signal<File | null>(null);
  protected readonly errorArchivo = signal<string | null>(null);
  private readonly intentado = signal(false);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly formatos = 'CSV, TXT, JSON, XLSX, XLS, PDF, PNG o JPG';
  protected readonly aceptar = EXTENSIONES_PERMITIDAS.map((e) => `.${e}`).join(',');
  protected readonly maxMetadatos = MAX_METADATOS;
  protected readonly mensajesMetadato = {
    pattern: 'Empieza con una letra o un número; solo letras, números, espacio, _ . -',
    maxlength: 'El texto es demasiado largo',
  };

  protected readonly mensajeArchivo = computed(
    () => this.errorArchivo() ?? (this.intentado() && this.archivo() === null ? 'Selecciona el archivo que quieres cargar.' : null),
  );

  protected readonly mensajes = computed(() => {
    const servidor = this.erroresServidor();
    const generico = 'Revisa este campo';
    return {
      descripcion: { maxlength: 'Máximo 2000 caracteres', servidor: servidor['descripcion'] ?? generico },
      periodoDesde: { servidor: servidor['periodoDesde'] ?? generico },
      periodoHasta: { servidor: servidor['periodoHasta'] ?? generico },
    };
  });

  ngOnInit(): void {
    this.fuentesApi
      .listar('activa')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fuentes) => {
          this.fuentes.set(fuentes);
          this.cargandoFuentes.set(false);
        },
        error: (e: unknown) => {
          this.errorFuentes.set(mensajeApi(e, 'No se pudieron cargar las fuentes.'));
          this.cargandoFuentes.set(false);
        },
      });
  }

  protected tamano(bytes: number): string {
    return formatearTamano(bytes);
  }

  protected fuenteInvalida(): boolean {
    const control = this.form.controls.fuenteId;
    return control.invalid && control.touched;
  }

  protected mensajeFuente(): string {
    const errores = this.form.controls.fuenteId.errors ?? {};
    if (errores['servidor']) return this.erroresServidor()['fuenteId'] ?? 'Revisa este campo';
    return 'Elige la fuente de la carga';
  }

  protected periodoInvalido(): boolean {
    const { periodoDesde, periodoHasta } = this.form.controls;
    return this.form.hasError('periodoInvertido') && (periodoDesde.touched || periodoHasta.touched);
  }

  protected filaIncompleta(fila: GrupoMetadato): boolean {
    return fila.hasError('incompleto') && (fila.controls.clave.touched || fila.controls.valor.touched);
  }

  alElegirArchivo(evento: Event): void {
    const elegido = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.archivo.set(null);
    this.errorArchivo.set(null);
    if (!elegido) return;

    if (!esArchivoPermitido(elegido.name)) {
      this.errorArchivo.set(`Ese tipo de archivo no está permitido. Usa ${this.formatos}.`);
      return;
    }
    if (elegido.size === 0) {
      this.errorArchivo.set('El archivo está vacío.');
      return;
    }
    this.archivo.set(elegido);
  }

  agregarMetadato(): void {
    if (this.metadatos.length >= MAX_METADATOS) return;
    this.metadatos.push(
      this.fb.group(
        {
          clave: ['', [Validators.maxLength(80), Validators.pattern(PATRON_NOMBRE_METADATO)]],
          valor: ['', [Validators.maxLength(1000)]],
        },
        { validators: [parCompleto] },
      ),
    );
  }

  quitarMetadato(indice: number): void {
    this.metadatos.removeAt(indice);
  }

  enviar(): void {
    if (this.guardando()) return;

    this.error.set(null);
    this.erroresServidor.set({});
    this.intentado.set(true);
    this.form.markAllAsTouched();

    const archivo = this.archivo();
    if (this.form.invalid || archivo === null) return;

    const valores = this.form.getRawValue();
    const metadatos: Record<string, string> = {};
    for (const fila of valores.metadatos) {
      const clave = fila.clave.trim();
      if (clave) metadatos[clave] = fila.valor.trim();
    }

    this.guardando.set(true);
    this.cargasApi
      .crear(
        {
          fuenteId: Number(valores.fuenteId),
          descripcion: valores.descripcion.trim(),
          periodoDesde: valores.periodoDesde,
          periodoHasta: valores.periodoHasta,
          metadatos,
        },
        archivo,
      )
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detalle) => {
          void this.router.navigateByUrl('/cargas', {
            state: { aviso: `Carga #${detalle.carga.id} recibida correctamente.` },
          });
        },
        error: (e: unknown) => this.mostrarError(e),
      });
  }

  /** Pone cada error de la API debajo de su campo; lo que no corresponda a un campo va en un mensaje general. */
  private mostrarError(error: unknown): void {
    const porCampo: Record<string, string> = {};
    const generales: string[] = [];

    for (const detalle of detallesDeError(error)) {
      const control = detalle.campo === 'metadatos' ? null : this.form.get(detalle.campo);
      if (control) {
        control.setErrors({ servidor: true });
        control.markAsTouched();
        porCampo[detalle.campo] = detalle.mensaje;
      } else {
        generales.push(detalle.mensaje);
      }
    }
    this.erroresServidor.set(porCampo);

    if (generales.length > 0) {
      this.error.set(generales.join(' '));
    } else if (Object.keys(porCampo).length > 0) {
      this.error.set('Revisa los campos marcados.');
    } else {
      this.error.set(mensajeApi(error, 'No se pudo registrar la carga. Inténtalo de nuevo.'));
    }
  }
}