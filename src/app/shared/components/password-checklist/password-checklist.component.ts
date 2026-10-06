import { Component, computed, input } from '@angular/core';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { evaluarPassword } from '@app/shared/utils/password-rules';

@Component({
    selector: 'app-password-checklist',
    imports: [IconComponent],
    template: `
    <div
      class="meter"
      [attr.data-nivel]="cumplidas()"
      role="progressbar"
      aria-label="Seguridad de la contraseña"
      aria-valuemin="0"
      aria-valuemax="4"
      [attr.aria-valuenow]="cumplidas()"
    >
      <span></span><span></span><span></span><span></span>
    </div>

    <ul class="rules">
      @for (regla of reglas(); track regla.id) {
        <li [class.rules__ok]="regla.cumple">
          @if (regla.cumple) {
            <app-icon name="check" [size]="14" />
          } @else {
            <i class="rules__dot" aria-hidden="true"></i>
          }
          <span>{{ regla.texto }}</span>
          <span class="sr-only">{{ regla.cumple ? '(cumplida)' : '(pendiente)' }}</span>
        </li>
      }
    </ul>
  `,
    styles: [
        `
      :host { display: block; margin-top: 12px; }
      .meter { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .meter span { height: 5px; border-radius: 4px; background: var(--line); transition: background 0.25s; }
      .meter[data-nivel='1'] span:nth-child(-n + 1) { background: var(--danger); }
      .meter[data-nivel='2'] span:nth-child(-n + 2) { background: var(--sun-deep); }
      .meter[data-nivel='3'] span:nth-child(-n + 3) { background: var(--sun); }
      .meter[data-nivel='4'] span { background: var(--primary); }
      .rules { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin: 12px 0 0; padding: 0; list-style: none; }
      .rules li { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--ink-soft); transition: color 0.2s; }
      .rules__ok { color: var(--primary); font-weight: 600; }
      .rules__dot { flex: none; width: 14px; height: 14px; border: 1.5px solid var(--line-strong); border-radius: 50%; }
      .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
      @media (max-width: 380px) { .rules { grid-template-columns: 1fr; } }
    `,
    ],
})
export class PasswordChecklistComponent {
    readonly valor = input('');
    protected readonly reglas = computed(() => evaluarPassword(this.valor()));
    protected readonly cumplidas = computed(() => this.reglas().filter((regla) => regla.cumple).length);
}