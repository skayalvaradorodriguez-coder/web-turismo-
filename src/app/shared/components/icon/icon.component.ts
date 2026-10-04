import { Component, computed, input } from '@angular/core';

export type IconName =
    | 'mail' | 'lock' | 'user' | 'eye' | 'eye-off' | 'alert' | 'check' | 'sun' | 'moon'
    | 'arrow-left' | 'compass' | 'pin' | 'database' | 'chart' | 'layers' | 'info' | 'google';

const TRAZOS: Record<Exclude<IconName, 'google'>, string[]> = {
    mail: ['M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z', 'm3 7 9 6.5L21 7'],
    lock: ['M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z', 'M8 11V8a4 4 0 0 1 8 0v3'],
    user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 20a8 8 0 0 1 16 0'],
    eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
    'eye-off': ['M3 3l18 18', 'M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9', 'M6.5 7.6C3.9 9.3 2 12 2 12s3.5 6 10 6a9.9 9.9 0 0 0 4-.9', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
    alert: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 8v5', 'M12 16.5v.01'],
    info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 7.6v.01'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    sun: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
    moon: ['M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z'],
    'arrow-left': ['M19 12H5', 'M11 6l-6 6 6 6'],
    compass: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1z'],
    pin: ['M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
    database: ['M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3z', 'M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5', 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'],
    chart: ['M5 20v-6', 'M12 20V5', 'M19 20V10'],
    layers: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5'],
};

@Component({
    selector: 'app-icon',
    host: { '[style.display]': '"inline-flex"', '[style.flex-shrink]': '0' },
    template: `
    @if (name() === 'google') {
      <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3A7.2 7.2 0 0 1 5.36 14.3H1.33v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.36 14.3A7.2 7.2 0 0 1 4.98 12c0-.8.14-1.58.38-2.3V6.6H1.33a12 12 0 0 0 0 10.8l4.03-3.1z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.33 6.6l4.03 3.1A7.2 7.2 0 0 1 12 4.75z" />
      </svg>
    } @else {
      <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none" stroke="currentColor"
           stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        @for (d of trazos(); track d) {
          <path [attr.d]="d" />
        }
      </svg>
    }
  `,
})
export class IconComponent {
    readonly name = input.required<IconName>();
    readonly size = input(20);

    readonly trazos = computed(() => {
        const nombre = this.name();
        return nombre === 'google' ? [] : TRAZOS[nombre];
    });
}