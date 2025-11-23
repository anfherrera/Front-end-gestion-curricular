import { Routes } from '@angular/router';

export const CommonRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'ajustes',
    loadComponent: () =>
      import('./ajustes/ajustes.component').then(m => m.AjustesComponent)
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./perfil/perfil.component').then(m => m.PerfilComponent)
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./notificaciones/notificaciones.component').then(m => m.NotificacionesComponent)
  },
  {
    path: 'notificaciones-guia',
    loadComponent: () =>
      import('../../shared/components/notificaciones-guia/notificaciones-guia.component').then(m => m.NotificacionesGuiaComponent)
  }
];
