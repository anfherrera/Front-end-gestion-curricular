import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // ✅ Home ya está creado
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/shared/home/home.component').then(m => m.HomeComponent),
      },

    ],
  },

  { path: '**', redirectTo: 'login' },
];
