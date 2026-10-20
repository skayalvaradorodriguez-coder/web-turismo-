import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import type { EstadoCarga } from '@app/core/models/carga.models';
import type { Procesamiento, ResultadoProcesamiento } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from '@app/core/services/procesamiento.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeApi } from '@app/shared/utils/api-error';
import {
  etiquetaEstadoProcesamiento,
  etiquetaTipoProcesamiento,
  formatearFechaHora,
  resumenResultado,
  textoConteo,
} from './procesamiento.utils';

type Accion = 'validar' | 'procesar';

@Component({
  selector: 'app-procesamiento-carga',
  imports: [IconComponent],
  templateUrl: './procesamiento-carga.component.html',
  styleUrl: './procesamiento-carga.component.scss',
})
export class ProcesamientoCargaComponent implements OnInit {
  private readonly api = inject(ProcesamientoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cargaId = input.required<number>();
  readonly estado = input.required<EstadoCarga>();
  readonly esGestion = input(false);
  /** false si la fuente de la carga todavia no tiene procesador. */
  readonly disponible = input(false);
  /** Se emite despues de validar o procesar, para que el detalle recargue la carga. */
  readonly cambio = output<void>();

  protected readonly procesamientos = signal<Procesamiento[]>([]);
  protected readonly cargandoLista = signal(false);
  protected readonly errorLista = signal<string | null>(null);
  protected readonly ejecutando = signal<Accion | null>(null);
  protected readonly confirmando = signal(false);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly resultado = signal<string | null>(null);

  protected readonly historial = computed(() => [...this.procesamientos()].sort((a, b) => b.id - a.id));
  /** La API acepta validar cargas recibidas o ya validadas. */
  protected readonly puedeValidar = computed(
    () => this.esGestion() && this.disponible() && (this.estado() === 'recibida' || this.estado() === 'validada'),
  );
  protected readonly puedeProcesar = computed(
    () => this.esGestion() && this.disponible() && this.estado() === 'validada',
  );
  protected readonly textoValidar = computed(() => {
    if (this.ejecutando() === 'validar') return 'Validando…';
    return this.estado() === 'validada' ? 'Validar de nuevo' : 'Validar';
  });

  protected readonly etiquetaTipo = etiquetaTipoProcesamiento;
  protected readonly etiquetaEstado = etiquetaEstadoProcesamiento;
  protected readonly fechaHora = formatearFechaHora;
  protected readonly conteo = textoConteo;

  ngOnInit(): void {
    if (this.disponible()) this.cargarHistorial();
  }

  protected validar(): void {
    this.ejecutar('validar', this.api.validar(this.cargaId()));
  }

  protected pedirConfirmacion(): void {
    this.errorAccion.set(null);
    this.confirmando.set(true);
  }

  protected cancelar(): void {
    this.confirmando.set(false);
  }

  protected procesar(): void {
    this.confirmando.set(false);
    this.ejecutar('procesar', this.api.procesar(this.cargaId()));
  }

  private ejecutar(accion: Accion, peticion: Observable<ResultadoProcesamiento>): void {
    if (this.ejecutando() !== null) return;

    this.errorAccion.set(null);
    this.resultado.set(null);
    this.ejecutando.set(accion);

    peticion
      .pipe(
        finalize(() => this.ejecutando.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (r) => {
          this.resultado.set(resumenResultado(r));
          this.cargarHistorial();
          this.cambio.emit();
        },
        error: (e: unknown) => {
          const porDefecto =
            accion === 'validar'
              ? 'No se pudo validar la carga. Inténtalo de nuevo.'
              : 'No se pudo procesar la carga. Inténtalo de nuevo.';
          this.errorAccion.set(mensajeApi(e, porDefecto));
          // Un intento fallido tambien queda en el historial
          this.cargarHistorial();
        },
      });
  }

  private cargarHistorial(): void {
    this.cargandoLista.set(true);
    this.errorLista.set(null);
    this.api
      .listar(this.cargaId())
      .pipe(
        finalize(() => this.cargandoLista.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lista) => this.procesamientos.set(lista),
        error: (e: unknown) => this.errorLista.set(mensajeApi(e, 'No se pudo cargar el historial.')),
      });
  }
}