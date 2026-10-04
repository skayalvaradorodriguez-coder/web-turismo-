import { Component, inject } from '@angular/core';
import { ThemeService } from '@app/core/services/theme.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';

@Component({
    selector: 'app-theme-toggle',
    imports: [IconComponent],
    template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="tema.alternar()"
      [attr.aria-label]="tema.esOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      [attr.aria-pressed]="tema.esOscuro()"
    >
      <app-icon [name]="tema.esOscuro() ? 'sun' : 'moon'" [size]="20" />
    </button>
  `,
})
export class ThemeToggleComponent {
    protected readonly tema = inject(ThemeService);
}