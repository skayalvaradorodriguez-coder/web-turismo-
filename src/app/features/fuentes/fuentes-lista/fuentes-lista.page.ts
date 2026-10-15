import { Component, OnInit, computed, inject, signal } from '@angular/core';
import type { EstadoFuente, Fuente } from '@app/core/models/fuente.models';
import { FuentesService } from '@app/core/services/fuentes.service';
import { mensajeErrorApi } from '@app/shared/utils/mensaje-error-api';
import { FiltroEstado, filtrarFuentes } from '../fuentes.utils';

@Component({
  selector: 'app-fuentes-lista',
  templateUrl: './fuentes-lista.page.html',
  styleUrl: './fuentes-lista.page.scss',
})
export class FuentesListaPage implements OnInit {
  private readonly api = inject(FuentesService);

  protected readonly fuentes = signal<Fuente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly estado = signal<FiltroEstado>('todas');

  protected readonly visibles = computed(() => filtrarFuentes(this.fuentes(), this.texto(), this.estado()));

  protected readonly filtros: readonly { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'activa', etiqueta: 'Activas' },
    { valor: 'inactiva', etiqueta: 'Inactivas' },
  ];

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
        this.error.set(mensajeErrorApi(e, 'No se pudieron cargar las fuentes.'));
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
}