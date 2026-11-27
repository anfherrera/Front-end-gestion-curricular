import { Routes } from '@angular/router';

export const CommonRoutes: Routes = [
  {
    path: 'home',
    title: 'Inicio',
    loadComponent: () => import('@features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'perfil',
    title: 'Mi perfil',
    loadComponent: () => import('@features/perfil/perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: 'notificaciones',
    title: 'Notificaciones',
    loadComponent: () =>
      import('@features/notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent),
  },
];
