import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@app/core/guards/auth.guard';

const MARCA = 'Observatorio Turístico Sostenible';

export const routes: Routes = [
  // Debe ir primero: si no, la raiz "/" coincide con el marco de acceso y se queda sin formulario
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-shell/auth-shell.component').then((m) => m.AuthShellComponent),
    children: [
      {
        path: 'login',
        title: `Iniciar sesión · ${MARCA}`,
        loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'registro',
        title: `Crear cuenta · ${MARCA}`,
        data: { titulo: 'Crear cuenta' },
        loadComponent: () => import('./features/auth/proximamente/proximamente.page').then((m) => m.ProximamentePage),
      },
      {
        path: 'recuperar',
        title: `Recuperar contraseña · ${MARCA}`,
        data: { titulo: 'Recuperar contraseña' },
        loadComponent: () => import('./features/auth/proximamente/proximamente.page').then((m) => m.ProximamentePage),
      },
    ],
  },
  {
    path: 'home',
    canActivate: [authGuard],
    title: `Inicio · ${MARCA}`,
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  { path: '**', redirectTo: 'home' },
];