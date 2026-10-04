import { Injectable, computed, signal } from '@angular/core';

export type ModoTema = 'light' | 'dark';

const CLAVE = 'ots-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // index.html ya aplico el tema antes de pintar la pagina (evita el "parpadeo"); aqui solo se lee
  private readonly _modo = signal<ModoTema>(
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
  );

  readonly modo = this._modo.asReadonly();
  readonly esOscuro = computed(() => this._modo() === 'dark');

  alternar(): void {
    const siguiente: ModoTema = this.esOscuro() ? 'light' : 'dark';
    this._modo.set(siguiente);

    const raiz = document.documentElement;
    raiz.setAttribute('data-theme', siguiente);
    raiz.classList.toggle('ion-palette-dark', siguiente === 'dark'); // mantiene Ionic en el mismo modo

    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      /* sin almacenamiento disponible: el tema solo dura esta visita */
    }
  }
}
