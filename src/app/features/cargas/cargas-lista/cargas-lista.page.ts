import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ROLES_GESTION } from '@app/core/config/roles';
import type { Carga, EstadoCarga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { mensajeApi } from '@app/shared/utils/api-error';
import { ESTADOS_CARGA, etiquetaEstadoCarga, etiquetaNivelIngreso, formatearPeriodo } from '../cargas.utils';

@Component({
  selector: 'app-cargas-lista',
  imports: [RouterLink],
  templateUrl: './cargas-lista.page.html',
  styleUrl: './cargas-lista.page.scss',
})
export class CargasListaPage implements OnInit {
  private readonly cargasApi = inject(CargasService);
  private readonly fuentesApi = inject(FuentesService);
  private readonly auth = inject(AuthService);
  private readonly limite = 20;
  private suscripcion?: Subscription;

  protected readonly cargas = signal<Carga[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  /** Mensaje de exito que deja el formulario al guardar (llega en el estado de la navegacion). */
  protected readonly aviso = signal<string | null>(null);

  protected readonly fuentes = signal<Fuente[]>([]);
  protected readonly fuenteId = signal<number | null>(null);
  protected readonly estado = signal<EstadoCarga | ''>('');

  protected readonly estados = ESTADOS_CARGA;
  protected readonly esGestion = computed(() => ROLES_GESTION.includes(this.auth.usuario()?.rol ?? ''));
  protected readonly hayFiltros = computed(() => this.fuenteId() !== null || this.estado() !== '');
  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limite)));
  private readonly nombresFuente = computed(() => new Map(this.fuentes().map((f) => [f.id, f.nombre])));

  constructor() {
    const estadoNavegacion = inject(Router).getCurrentNavigation()?.extras.state as { aviso?: string } | undefined;
    if (estadoNavegacion?.aviso) this.aviso.set(estadoNavegacion.aviso);

    // si la persona sale de la pantalla, no se atiende una respuesta que ya no se ve
    inject(DestroyRef).onDestroy(() => this.suscripcion?.unsubscribe());
  }

  ngOnInit(): void {
    this.cargarFuentes();
    this.cargar();
  }

  /** Solo sirve para mostrar el nombre de cada fuente; si falla, se muestra "Fuente #id". */
  private cargarFuentes(): void {
    this.fuentesApi.listar().subscribe({
      next: (fuentes) => this.fuentes.set(fuentes),
      error: () => undefined,
    });
  }

  protected cargar(): void {
    this.suscripcion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    const estado = this.estado();
    this.suscripcion = this.cargasApi
      .listar({
        fuenteId: this.fuenteId() ?? undefined,
        estado: estado === '' ? undefined : estado,
        pagina: this.pagina(),
        limite: this.limite,
      })
      .subscribe({
        next: (respuesta) => {
          this.cargas.set(respuesta.cargas);
          this.total.set(respuesta.total);
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.error.set(mensajeApi(e, 'No se pudieron cargar las cargas.'));
          this.cargando.set(false);
        },
      });
  }

  protected alCambiarFuente(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.fuenteId.set(valor ? Number(valor) : null);
    this.pagina.set(1);
    this.cargar();
  }

  protected alCambiarEstado(evento: Event): void {
    this.estado.set((evento.target as HTMLSelectElement).value as EstadoCarga | '');
    this.pagina.set(1);
    this.cargar();
  }

  protected quitarFiltros(): void {
    this.fuenteId.set(null);
    this.estado.set('');
    this.pagina.set(1);
    this.cargar();
  }

  protected irAPagina(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
    this.cargar();
  }

  protected nombreFuente(id: number): string {
    return this.nombresFuente().get(id) ?? `Fuente #${id}`;
  }

  protected etiquetaEstado(estado: EstadoCarga): string {
    return etiquetaEstadoCarga(estado);
  }

  protected etiquetaNivel(nivel: number): string {
    return etiquetaNivelIngreso(nivel);
  }

  protected periodo(carga: Carga): string {
    return formatearPeriodo(carga.periodoDesde, carga.periodoHasta);
  }

  protected fechaRegistro(iso: string): string {
    const fecha = new Date(iso);
    return Number.isNaN(fecha.getTime())
      ? ''
      : fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}