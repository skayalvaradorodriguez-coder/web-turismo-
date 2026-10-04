import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '@app/shared/components/icon/icon.component';

@Component({
    selector: 'app-proximamente',
    imports: [RouterLink, IconComponent],
    template: `
    <span class="ui-icon"><app-icon name="info" [size]="24" /></span>
    <h1 class="ui-title">{{ titulo }}</h1>
    <p class="ui-sub">Esta sección se activa en una de las siguientes etapas del desarrollo.</p>
    <a routerLink="/login" class="link"><app-icon name="arrow-left" [size]="16" /> Volver a iniciar sesión</a>
  `,
    styles: [':host { display: block; } a { display: inline-flex; align-items: center; gap: 8px; }'],
})
export class ProximamentePage {
    protected readonly titulo = (inject(ActivatedRoute).snapshot.data['titulo'] as string | undefined) ?? 'Próximamente';
}