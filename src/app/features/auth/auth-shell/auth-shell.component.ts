import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { ThemeToggleComponent } from '@app/shared/components/theme-toggle/theme-toggle.component';

@Component({
    selector: 'app-auth-shell',
    templateUrl: 'auth-shell.component.html',
    imports: [RouterOutlet, IonContent, IconComponent, ThemeToggleComponent],
})
export class AuthShellComponent {
    protected readonly anio = new Date().getFullYear();
}