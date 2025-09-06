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
  }
];
