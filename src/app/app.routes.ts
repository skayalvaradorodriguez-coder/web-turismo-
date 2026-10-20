import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@app/core/guards/auth.guard';
import { rolGuard } from '@app/core/guards/roles.guard';
import { ROLES_CONSULTA, ROLES_GESTION } from '@app/core/config/roles';

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
      {
        path: 'fuentes',
        canActivate: [rolGuard(...ROLES_CONSULTA)],
        title: `Fuentes · ${MARCA}`,
        loadComponent: () =>
          import('./features/fuentes/fuentes-lista/fuentes-lista.page').then((m) => m.FuentesListaPage),
      },
      {
        path: 'cargas/nueva',
        canActivate: [rolGuard(...ROLES_GESTION)],
        title: `Nueva carga · ${MARCA}`,
        loadComponent: () =>
          import('./features/cargas/carga-form/carga-form.page').then((m) => m.CargaFormPage),
      },
      {
        path: 'cargas',
        canActivate: [rolGuard(...ROLES_CONSULTA)],
        title: `Cargas · ${MARCA}`,
        loadComponent: () =>
          import('./features/cargas/cargas-lista/cargas-lista.page').then((m) => m.CargasListaPage),
      },
      {
        path: 'cargas/:id',
        canActivate: [rolGuard(...ROLES_CONSULTA)],
        title: `Detalle de carga · ${MARCA}`,
        loadComponent: () =>
          import('./features/cargas/carga-detalle/carga-detalle.page').then((m) => m.CargaDetallePage),
      },
      {
        path: 'usuarios',
        canActivate: [rolGuard(...ROLES_GESTION)],
        title: `Usuarios · ${MARCA}`,
        loadComponent: () =>
          import('./features/usuarios/usuarios-lista/usuarios-lista.page').then((m) => m.UsuariosListaPage),
      },
      {
        path: 'fuentes/nueva',
        canActivate: [rolGuard(...ROLES_GESTION)],
        title: `Nueva fuente · ${MARCA}`,
        loadComponent: () =>
          import('./features/fuentes/fuente-form/fuente-form.page').then((m) => m.FuenteFormPage),
      },
      {
        path: 'fuentes/:id/editar',
        canActivate: [rolGuard(...ROLES_GESTION)],
        title: `Editar fuente · ${MARCA}`,
        loadComponent: () =>
          import('./features/fuentes/fuente-form/fuente-form.page').then((m) => m.FuenteFormPage),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];