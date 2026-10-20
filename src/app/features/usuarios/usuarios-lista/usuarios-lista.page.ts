import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription, finalize } from 'rxjs';
import { ETIQUETA_ROL } from '@app/core/config/roles';
import type { EstadoUsuario, RolAsignable, UsuarioGestion } from '@app/core/models/usuario.models';
import { AuthService } from '@app/core/services/auth.service';
import { UsuariosService } from '@app/core/services/usuarios.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeApi } from '@app/shared/utils/api-error';
import { Permisos, etiquetaEstadoUsuario, nombreCompleto, permisosSobre, ultimoAcceso } from '../usuarios.utils';

const POR_PAGINA = 20;
const ROLES_ASIGNABLES: readonly string[] = ['admin', 'investigador', 'externo'];
const SIN_PERMISOS: Permisos = { rolesDisponibles: [], puedeCambiarEstado: false };

const valorDe = (evento: Event): string => (evento.target as HTMLInputElement | HTMLSelectElement).value;

@Component({
  selector: 'app-usuarios-lista',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './usuarios-lista.page.html',
  styleUrl: './usuarios-lista.page.scss',
})
export class UsuariosListaPage implements OnInit {
  private readonly api = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  /** La peticion de la lista en curso: si se cambia un filtro, se cancela y se pide la nueva. */
  private peticion: Subscription | null = null;

  protected readonly usuarios = signal<UsuarioGestion[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly filtroRol = signal('');
  protected readonly filtroEstado = signal<'' | EstadoUsuario>('');
  protected readonly texto = new FormControl('', { nonNullable: true });
  private readonly textoAplicado = signal('');
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  protected readonly editandoRolId = signal<number | null>(null);
  protected readonly rolElegido = signal<RolAsignable | ''>('');
  protected readonly confirmandoId = signal<number | null>(null);
  protected readonly trabajandoId = signal<number | null>(null);
  protected readonly errorAccion = signal<{ id: number; mensaje: string } | null>(null);

  protected readonly nombre = nombreCompleto;
  protected readonly estado = etiquetaEstadoUsuario;
  protected readonly acceso = ultimoAcceso;
  protected readonly valor = valorDe;

  ngOnInit(): void {
    this.cargar();
  }

  protected rol(codigo: string): string {
    return ETIQUETA_ROL[codigo] ?? codigo;
  }

  protected permisos(usuario: UsuarioGestion): Permisos {
    const actor = this.auth.usuario();
    return actor ? permisosSobre(actor, usuario) : SIN_PERMISOS;
  }

  // ---------------------------------------------------------------- filtros y paginas
  protected elegirRolFiltro(valor: string): void {
    this.filtroRol.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  protected elegirEstadoFiltro(valor: string): void {
    this.filtroEstado.set(valor === 'activa' || valor === 'inactiva' ? valor : '');
    this.pagina.set(1);
    this.cargar();
  }

  protected buscar(evento: Event): void {
    evento.preventDefault();
    this.textoAplicado.set(this.texto.value.trim());
    this.pagina.set(1);
    this.cargar();
  }

  protected irAPagina(numero: number): void {
    if (numero < 1 || numero > this.totalPaginas() || numero === this.pagina()) return;
    this.pagina.set(numero);
    this.cargar();
  }

  protected cargar(): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.peticion = this.api
      .listar({
        rol: this.filtroRol() || undefined,
        estado: this.filtroEstado() || undefined,
        texto: this.textoAplicado() || undefined,
        pagina: this.pagina(),
        limite: POR_PAGINA,
      })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.usuarios.set(pagina.usuarios);
          this.total.set(pagina.total);
        },
        error: (e: unknown) => this.error.set(mensajeApi(e, 'No se pudo cargar la lista de usuarios.')),
      });
  }

  // ---------------------------------------------------------------- cambiar rol
  protected abrirRol(usuario: UsuarioGestion): void {
    this.confirmandoId.set(null);
    this.errorAccion.set(null);
    this.rolElegido.set('');
    this.editandoRolId.set(usuario.id);
  }

  protected cancelarRol(): void {
    this.editandoRolId.set(null);
  }

  protected elegirRol(valor: string): void {
    this.rolElegido.set(ROLES_ASIGNABLES.includes(valor) ? (valor as RolAsignable) : '');
  }

  protected guardarRol(usuario: UsuarioGestion): void {
    const rol = this.rolElegido();
    if (rol === '') return;
    this.aplicar(
      usuario,
      this.api.cambiarRol(usuario.id, rol),
      (nuevo) => `Rol de ${nombreCompleto(nuevo)} cambiado a ${this.rol(nuevo.rol)}.`,
      'No se pudo cambiar el rol. Inténtalo de nuevo.',
    );
  }

  // ---------------------------------------------------------------- activar y desactivar
  protected pedirDesactivar(usuario: UsuarioGestion): void {
    this.editandoRolId.set(null);
    this.errorAccion.set(null);
    this.confirmandoId.set(usuario.id);
  }

  protected cancelarConfirmacion(): void {
    this.confirmandoId.set(null);
  }

  protected cambiarEstado(usuario: UsuarioGestion, estado: EstadoUsuario): void {
    this.aplicar(
      usuario,
      this.api.cambiarEstado(usuario.id, estado),
      (nuevo) =>
        estado === 'activa'
          ? `Cuenta de ${nombreCompleto(nuevo)} activada.`
          : `Cuenta de ${nombreCompleto(nuevo)} desactivada. Sus sesiones se cerraron.`,
      'No se pudo cambiar el estado de la cuenta. Inténtalo de nuevo.',
    );
  }

  private aplicar(
    usuario: UsuarioGestion,
    peticion: Observable<UsuarioGestion>,
    aviso: (nuevo: UsuarioGestion) => string,
    porDefecto: string,
  ): void {
    if (this.trabajandoId() !== null) return;

    this.errorAccion.set(null);
    this.aviso.set(null);
    this.trabajandoId.set(usuario.id);

    peticion
      .pipe(
        finalize(() => this.trabajandoId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (nuevo) => {
          this.usuarios.update((lista) => lista.map((u) => (u.id === nuevo.id ? nuevo : u)));
          this.editandoRolId.set(null);
          this.confirmandoId.set(null);
          this.aviso.set(aviso(nuevo));
        },
        error: (e: unknown) => this.errorAccion.set({ id: usuario.id, mensaje: mensajeApi(e, porDefecto) }),
      });
  }
}