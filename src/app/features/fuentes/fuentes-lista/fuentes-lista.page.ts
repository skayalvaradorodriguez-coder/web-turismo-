import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ROLES_GESTION } from '@app/core/config/roles';
import type { EstadoFuente, Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { mensajeApi } from '@app/shared/utils/api-error';
import { FiltroEstado, filtrarFuentes } from '../fuentes.utils';

@Component({
  selector: 'app-fuentes-lista',
  imports: [RouterLink],
  templateUrl: './fuentes-lista.page.html',
  styleUrl: './fuentes-lista.page.scss',
})
export class FuentesListaPage implements OnInit {
  private readonly api = inject(FuentesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fuentes = signal<Fuente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly estado = signal<FiltroEstado>('todas');
  /** Mensaje de exito (llega del formulario en el estado de la navegacion, o de activar/desactivar). */
  protected readonly aviso = signal<string | null>(null);

  /** Fuente que esta pidiendo confirmacion para desactivarse. */
  protected readonly confirmandoId = signal<number | null>(null);
  /** Fuente cuyo cambio de estado esta en curso. */
  protected readonly cambiandoId = signal<number | null>(null);
  /** Error del ultimo cambio de estado, con la fuente a la que pertenece. */
  protected readonly errorAccion = signal<{ id: number; mensaje: string } | null>(null);

  protected readonly esGestion = computed(() => ROLES_GESTION.includes(this.auth.usuario()?.rol ?? ''));
  protected readonly visibles = computed(() => filtrarFuentes(this.fuentes(), this.texto(), this.estado()));

  protected readonly filtros: readonly { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'activa', etiqueta: 'Activas' },
    { valor: 'inactiva', etiqueta: 'Inactivas' },
  ];

  constructor() {
    const estadoNavegacion = inject(Router).getCurrentNavigation()?.extras.state as { aviso?: string } | undefined;
    if (estadoNavegacion?.aviso) this.aviso.set(estadoNavegacion.aviso);
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listar().subscribe({
      next: (fuentes) => {
        this.fuentes.set(fuentes);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.error.set(mensajeApi(e, 'No se pudieron cargar las fuentes.'));
        this.cargando.set(false);
      },
    });
  }

  protected alBuscar(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  protected quitarFiltros(): void {
    this.texto.set('');
    this.estado.set('todas');
  }

  protected etiquetaEstado(estado: EstadoFuente): string {
    return estado === 'activa' ? 'Activa' : 'Inactiva';
  }

  protected pedirDesactivar(id: number): void {
    this.errorAccion.set(null);
    this.confirmandoId.set(id);
  }

  protected cancelarConfirmacion(): void {
    this.confirmandoId.set(null);
  }

  protected cambiarEstado(fuente: Fuente, nuevo: EstadoFuente): void {
    if (this.cambiandoId() !== null) return;

    this.errorAccion.set(null);
    this.aviso.set(null);
    this.cambiandoId.set(fuente.id);

    this.api
      .cambiarEstado(fuente.id, nuevo)
      .pipe(
        finalize(() => this.cambiandoId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (actualizada) => {
          this.fuentes.update((lista) => lista.map((f) => (f.id === actualizada.id ? actualizada : f)));
          this.confirmandoId.set(null);
          this.aviso.set(`Fuente "${actualizada.nombre}" ${nuevo === 'activa' ? 'activada' : 'desactivada'}.`);
        },
        error: (e: unknown) => {
          this.confirmandoId.set(null);
          this.errorAccion.set({
            id: fuente.id,
            mensaje: mensajeApi(e, 'No se pudo cambiar el estado de la fuente. Inténtalo de nuevo.'),
          });
        },
      });
  }
}