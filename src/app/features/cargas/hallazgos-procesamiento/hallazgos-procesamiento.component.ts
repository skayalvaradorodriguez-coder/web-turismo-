import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';
import type { PaginaHallazgos, SeveridadHallazgo } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from '@app/core/services/procesamiento.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeApi } from '@app/shared/utils/api-error';
import { textoConteo } from '../procesamiento-carga/procesamiento.utils';
import { etiquetaSeveridad, nombreRegla, ubicacionHallazgo, valorVisible } from './hallazgos.utils';

const POR_PAGINA = 25;

type FiltroSeveridad = SeveridadHallazgo | null;

@Component({
  selector: 'app-hallazgos-procesamiento',
  imports: [IconComponent],
  templateUrl: './hallazgos-procesamiento.component.html',
  styleUrl: './hallazgos-procesamiento.component.scss',
})
export class HallazgosProcesamientoComponent implements OnInit {
  private readonly api = inject(ProcesamientoService);
  private readonly destroyRef = inject(DestroyRef);
  /** La peticion en curso: si el usuario cambia de filtro o de pagina, se cancela y se pide la nueva. */
  private peticion: Subscription | null = null;

  readonly cargaId = input.required<number>();
  readonly procesamientoId = input.required<number>();

  protected readonly datos = signal<PaginaHallazgos | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal<FiltroSeveridad>(null);
  protected readonly pagina = signal(1);

  protected readonly totalPaginas = computed(() => {
    const d = this.datos();
    return d ? Math.max(1, Math.ceil(d.total / d.limite)) : 1;
  });

  protected readonly filtros: ReadonlyArray<{ valor: FiltroSeveridad; texto: string }> = [
    { valor: null, texto: 'Todos' },
    { valor: 'error', texto: 'Errores' },
    { valor: 'alerta', texto: 'Alertas' },
  ];

  protected readonly etiquetaSeveridad = etiquetaSeveridad;
  protected readonly nombreRegla = nombreRegla;
  protected readonly ubicacion = ubicacionHallazgo;
  protected readonly valor = valorVisible;
  protected readonly conteo = textoConteo;

  ngOnInit(): void {
    this.cargar();
  }

  protected elegirFiltro(valor: FiltroSeveridad): void {
    if (valor === this.filtro()) return;
    this.filtro.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  protected irAPagina(numero: number): void {
    if (numero < 1 || numero > this.totalPaginas() || numero === this.pagina()) return;
    this.pagina.set(numero);
    this.cargar();
  }

  private cargar(): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.peticion = this.api
      .hallazgos(this.cargaId(), this.procesamientoId(), {
        severidad: this.filtro() ?? undefined,
        pagina: this.pagina(),
        limite: POR_PAGINA,
      })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datos) => this.datos.set(datos),
        error: (e: unknown) => this.error.set(mensajeApi(e, 'No se pudieron cargar los hallazgos.')),
      });
  }
}