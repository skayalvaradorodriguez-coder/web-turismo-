import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ETIQUETA_ROL } from '@app/core/config/roles';
import { menuPara } from '@app/core/config/navegacion';
import { AuthService } from '@app/core/services/auth.service';
import { ThemeService } from '@app/core/services/theme.service';

const PANTALLA_GRANDE = '(min-width: 900px)';

@Component({
  selector: 'app-main-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss',
})
export class MainShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly tema = inject(ThemeService);

  protected readonly usuario = this.auth.usuario;
  protected readonly menu = computed(() => menuPara(this.usuario()?.rol));
  protected readonly rolEtiqueta = computed(() => {
    const rol = this.usuario()?.rol ?? '';
    return ETIQUETA_ROL[rol] ?? rol;
  });
  protected readonly iniciales = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase() : '';
  });

  /** En pantalla grande el menu arranca abierto; en teléfono, cerrado. */
  protected readonly menuAbierto = signal(window.matchMedia(PANTALLA_GRANDE).matches);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  /** En teléfono el menu es un cajón: se cierra al elegir una opción. */
  protected alNavegar(): void {
    if (!window.matchMedia(PANTALLA_GRANDE).matches) this.menuAbierto.set(false);
  }

  protected cerrarSesion(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
    });
  }
}