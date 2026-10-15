import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ROLES_GESTION } from '@app/core/config/roles';
import type { ArchivoOriginal, DetalleCarga, EstadoCarga } from '@app/core/models/carga.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { FieldComponent } from '@app/shared/components/field/field.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeApi } from '@app/shared/utils/api-error';
import { guardarArchivo } from '@app/shared/utils/guardar-archivo';
import { etiquetaEstadoCarga, etiquetaNivelIngreso, formatearPeriodo, formatearTamano } from '../cargas.utils';

/** Estados en los que todavia se puede rechazar (los mismos que acepta la API). */
const ESTADOS_ABIERTOS: readonly EstadoCarga[] = ['recibida', 'validada'];

/** La API recorta los espacios: el motivo debe tener al menos 5 caracteres ya recortado. */
function motivoValido(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim().length >= 5 ? null : { minlength: true };
}

@Component({
  selector: 'app-carga-detalle',
  imports: [RouterLink, FieldComponent, IconComponent],
  templateUrl: './carga-detalle.page.html',
  styleUrl: './carga-detalle.page.scss',
})
export class CargaDetallePage implements OnInit {
  private readonly cargasApi = inject(CargasService);
  private readonly fuentesApi = inject(FuentesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly detalle = signal<DetalleCarga | null>(null);
  private readonly nombreFuente = signal<string | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly descargandoId = signal<number | null>(null);
  protected readonly errorDescarga = signal<string | null>(null);

  protected readonly rechazando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorRechazo = signal<string | null>(null);
  readonly motivo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, motivoValido, Validators.maxLength(1000)],
  });
  protected readonly mensajesMotivo = {
    required: 'Escribe el motivo del rechazo',
    minlength: 'Escribe al menos 5 caracteres',
    maxlength: 'Máximo 1000 caracteres',
  };

  protected readonly esGestion = computed(() => ROLES_GESTION.includes(this.auth.usuario()?.rol ?? ''));
  protected readonly puedeRechazar = computed(
    () => this.esGestion() && ESTADOS_ABIERTOS.includes(this.detalle()?.carga.estado ?? 'publicada'),
  );
  protected readonly tituloFuente = computed(
    () => this.nombreFuente() ?? `Fuente #${this.detalle()?.carga.fuenteId ?? ''}`,
  );

  ngOnInit(): void {
    if (!Number.isInteger(this.id) || this.id <= 0) {
      this.error.set('La carga no existe.');
      this.cargando.set(false);
      return;
    }

    this.cargasApi
      .obtener(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.cargando.set(false);
          this.cargarNombreFuente(detalle.carga.fuenteId);
        },
        error: (e: unknown) => {
          this.error.set(mensajeApi(e, 'No se pudo cargar la carga.'));
          this.cargando.set(false);
        },
      });
  }

  /** Solo sirve para mostrar el nombre; si falla, se muestra "Fuente #id". */
  private cargarNombreFuente(fuenteId: number): void {
    this.fuentesApi
      .obtener(fuenteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (fuente) => this.nombreFuente.set(fuente.nombre), error: () => undefined });
  }

  protected etiquetaEstado(estado: EstadoCarga): string {
    return etiquetaEstadoCarga(estado);
  }

  protected etiquetaNivel(nivel: number): string {
    return etiquetaNivelIngreso(nivel);
  }

  protected periodo(desde: string | null, hasta: string | null): string {
    return formatearPeriodo(desde, hasta);
  }

  protected tamano(bytes: number): string {
    return formatearTamano(bytes);
  }

  protected fechaHora(iso: string): string {
    const fecha = new Date(iso);
    return Number.isNaN(fecha.getTime())
      ? ''
      : fecha.toLocaleString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  descargar(archivo: ArchivoOriginal): void {
    if (this.descargandoId() !== null) return;

    this.errorDescarga.set(null);
    this.descargandoId.set(archivo.id);
    this.cargasApi
      .descargar(this.id, archivo.id)
      .pipe(
        finalize(() => this.descargandoId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (contenido) => guardarArchivo(contenido, archivo.nombreOriginal),
        error: (e: unknown) => this.errorDescarga.set(mensajeApi(e, 'No se pudo descargar el archivo. Inténtalo de nuevo.')),
      });
  }

  abrirRechazo(): void {
    this.errorRechazo.set(null);
    this.motivo.reset('');
    this.rechazando.set(true);
  }

  cancelarRechazo(): void {
    this.rechazando.set(false);
  }

  confirmarRechazo(): void {
    if (this.guardando()) return;

    this.errorRechazo.set(null);
    this.motivo.markAsTouched();
    if (this.motivo.invalid) return;

    this.guardando.set(true);
    this.cargasApi
      .rechazar(this.id, this.motivo.value.trim())
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.rechazando.set(false);
          this.aviso.set('La carga fue rechazada. El archivo original se conserva.');
        },
        error: (e: unknown) => this.errorRechazo.set(mensajeApi(e, 'No se pudo rechazar la carga. Inténtalo de nuevo.')),
      });
  }
}