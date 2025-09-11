import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CommonRoutes } from './pages/common/common.routes';

export const routes: Routes = [
  // Redirección por defecto al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  // Layout protegido por authGuard
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      // Redirección por defecto dentro del layout
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // ==========================
      // Rutas comunes (home, ajustes)
      // ==========================
      ...CommonRoutes,

      // ==========================
      // Estudiante
      // ==========================
      {
        path: 'estudiante/paz-salvo',
        loadComponent: () =>
          import('./pages/estudiante/paz-salvo/paz-salvo.component').then(m => m.PazSalvoComponent),
      },
      {
        path: 'estudiante/pruebas-ecaes',
        loadComponent: () =>
          import('./pages/estudiante/pruebas-ecaes/pruebas-ecaes.component').then(m => m.PruebasEcaesComponent),
      },
      {
        path: 'estudiante/cursos-intersemestrales',
        loadComponent: () =>
          import('./pages/estudiante/cursos-intersemestrales/cursos-intersemestrales.component').then(m => m.CursosIntersemestralesComponent),
      },
      {
        path: 'estudiante/homologacion-asignaturas',
        loadComponent: () =>
          import('./pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent),
      },
      {
        path: 'estudiante/reingreso-estudiante',
        loadComponent: () =>
          import('./pages/estudiante/reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent),
      },

      // ==========================
      // Funcionario
      // ==========================
      {
        path: 'funcionario/paz-salvo',
        loadComponent: () =>
          import('./pages/funcionario/paz-salvo/paz-salvo.component').then(m => m.PazSalvoComponent),
      },
      {
        path: 'funcionario/pruebas-ecaes',
        loadComponent: () =>
          import('./pages/funcionario/pruebas-ecaes/pruebas-ecaes.component').then(m => m.PruebasEcaesComponent),
      },
      {
        path: 'funcionario/cursos-intersemestrales',
        loadComponent: () =>
          import('./pages/funcionario/cursos-intersemestrales/cursos-intersemestrales.component').then(m => m.CursosIntersemestralesComponent),
      },
      {
        path: 'funcionario/reingreso-estudiante',
        loadComponent: () =>
          import('./pages/funcionario/reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent),
      },
      {
        path: 'funcionario/homologacion-asignaturas',
        loadComponent: () =>
          import('./pages/funcionario/homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent),
      },
      {
        path: 'funcionario/modulo-estadistico',
        loadComponent: () =>
          import('./pages/funcionario/modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent),
      },

      // ==========================
      // Coordinador
      // ==========================
      {
        path: 'coordinador/paz-salvo',
        loadComponent: () =>
          import('./pages/coordinador/paz-salvo/paz-salvo.component').then(m => m.PazSalvoCoordinadorComponent),
      },
      {
        path: 'coordinador/reingreso-estudiante',
        loadComponent: () =>
          import('./pages/coordinador/reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent),
      },
      {
        path: 'coordinador/homologacion-asignaturas',
        loadComponent: () =>
          import('./pages/coordinador/homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent),
      },
      {
        path: 'coordinador/modulo-estadistico',
        loadComponent: () =>
          import('./pages/coordinador/modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent),
      },

      // ==========================
      // Secretaria
      // ==========================
      {
        path: 'secretaria/paz-salvo',
        loadComponent: () =>
          import('./pages/secretaria/paz-salvo/paz-salvo.component').then(m => m.PazSalvoComponent),
      },
      {
        path: 'secretaria/reingreso-estudiante',
        loadComponent: () =>
          import('./pages/secretaria/reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent),
      },
      {
        path: 'secretaria/homologacion-asignaturas',
        loadComponent: () =>
          import('./pages/secretaria/homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent),
      },

      // ==========================
      // Admin
      // ==========================
      {
        path: 'admin/dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'admin/manage-users',
        loadComponent: () =>
          import('./pages/admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
      },
      {
        path: 'admin/manage-roles',
        loadComponent: () =>
          import('./pages/admin/manage-roles/manage-roles.component').then(m => m.ManageRolesComponent),
      },
      {
        path: 'admin/manage-processes',
        loadComponent: () =>
          import('./pages/admin/manage-processes/manage-processes.component').then(m => m.ManageProcessesComponent),
      },
    ],
  },

  // Ruta comodín
  { path: '**', redirectTo: 'login' },
];
