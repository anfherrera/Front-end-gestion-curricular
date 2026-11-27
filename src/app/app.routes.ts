import { Route, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { UserRole } from '@core/enums/roles.enum';
import { CommonRoutes } from './routes/common.routes';

/** /<rol>/…: sus rutas hijas solo las abre una sesión con ese rol (si no, RoleGuard lleva a /welcome). */
function rutasDeRol(path: string, role: UserRole, loadChildren: Route['loadChildren']): Route {
  return { path, canActivateChild: [authGuard, RoleGuard], data: { role }, loadChildren };
}

export const routes: Routes = [
  // Redirección por defecto al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login
  {
    path: 'login',
    loadComponent: () => import('@features/login/login.component').then((m) => m.LoginComponent),
  },

  // Layout protegido por authGuard
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },

      // Página de bienvenida
      {
        path: 'welcome',
        loadComponent: () => import('@features/welcome/welcome.component').then((m) => m.WelcomeComponent),
      },

      // Rutas comunes (home, perfil, notificaciones)
      ...CommonRoutes,

      // Rutas de cada rol
      rutasDeRol('estudiante', UserRole.ESTUDIANTE, () =>
        import('./routes/estudiante.routes').then((m) => m.EstudianteRoutes)
      ),
      rutasDeRol('funcionario', UserRole.FUNCIONARIO, () =>
        import('./routes/gestion.routes').then((m) => m.FuncionarioRoutes)
      ),
      rutasDeRol('coordinador', UserRole.COORDINADOR, () =>
        import('./routes/gestion.routes').then((m) => m.CoordinadorRoutes)
      ),
      rutasDeRol('secretaria', UserRole.SECRETARIA, () =>
        import('./routes/secretaria.routes').then((m) => m.SecretariaRoutes)
      ),
      rutasDeRol('decano', UserRole.DECANO, () => import('./routes/gestion.routes').then((m) => m.DecanoRoutes)),

      // Admin: su guard va con canActivate en el padre
      {
        path: 'admin',
        loadChildren: () => import('@features/admin/admin.routes').then((m) => m.AdminRoutes),
        canActivate: [RoleGuard],
        data: { role: UserRole.ADMIN },
      },
    ],
  },

  // Ruta comodín
  { path: '**', redirectTo: 'login' },
];
