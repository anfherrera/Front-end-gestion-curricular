import { Routes } from '@angular/router';

export const CommonRoutes: Routes = [
  {
    path: 'home',
    title: 'Inicio',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'perfil',
    title: 'Mi perfil',
    loadComponent: () => import('./perfil/perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: 'notificaciones',
    title: 'Notificaciones',
    loadComponent: () => import('./notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent),
  },
];
