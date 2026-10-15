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
        loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'verificar',
        title: `Verificar correo · ${MARCA}`,
        loadComponent: () => import('./features/auth/verify-email/verify-email.page').then((m) => m.VerifyEmailPage),
      },
      {
        path: 'recuperar',
        title: `Recuperar contraseña · ${MARCA}`,
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'restablecer',
        title: `Contraseña nueva · ${MARCA}`,
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-shell/main-shell.component').then((m) => m.MainShellComponent),
    children: [
      {
        path: 'home',
        title: `Inicio · ${MARCA}`,
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];