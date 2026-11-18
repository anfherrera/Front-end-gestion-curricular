import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { UserRole } from '@core/enums/roles.enum';
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
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },

      // Página de bienvenida
      { path: 'welcome', loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent) },

      // ==========================
      // Rutas comunes (home, perfil, notificaciones)
      // ==========================
      ...CommonRoutes,

      // ==========================
      // Estudiante
      // ==========================
      {
        path: 'estudiante',
        canActivateChild: [authGuard, RoleGuard],
        data: { role: UserRole.ESTUDIANTE },
        loadChildren: () =>
          import('./pages/estudiante/estudiante.routes').then(m => m.EstudianteRoutes),
      },

      // ==========================
      // Funcionario
      // ==========================
      {
        path: 'funcionario',
        canActivateChild: [authGuard, RoleGuard],
        data: { role: UserRole.FUNCIONARIO },
        children: [
          { path: 'paz-salvo', data: { rolRevision: 'funcionario' }, loadComponent: () => import('./pages/common/paz-salvo-revision/paz-salvo-revision.component').then(m => m.PazSalvoRevisionComponent) },
          { path: 'pruebas-ecaes', loadComponent: () => import('./pages/funcionario/pruebas-ecaes/pruebas-ecaes.component').then(m => m.PruebasEcaesFuncionarioComponent) },
          {
            path: 'cursos-intersemestrales',
            loadChildren: () =>
              import('./pages/common/cursos-intersemestrales/cursos-intersemestrales.routes')
                .then(m => m.CursosIntersemestralesGestionRoutes),
          },
          { path: 'reingreso-estudiante', data: { rolRevision: 'funcionario' }, loadComponent: () => import('./pages/common/reingreso-revision/reingreso-revision.component').then(m => m.ReingresoRevisionComponent) },
          { path: 'homologacion-asignaturas', data: { rolRevision: 'funcionario' }, loadComponent: () => import('./pages/common/homologacion-revision/homologacion-revision.component').then(m => m.HomologacionRevisionComponent) },
          { path: 'modulo-estadistico', loadComponent: () => import('./pages/common/modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent) },
          { path: 'historial-completo', loadComponent: () => import('./pages/common/historial-completo/historial-completo.component').then(m => m.HistorialCompletoComponent) },
        ]
      },

      // ==========================
      // Coordinador
      // ==========================
      {
        path: 'coordinador',
        canActivateChild: [authGuard, RoleGuard],
        data: { role: UserRole.COORDINADOR },
        children: [
          { path: 'paz-salvo', data: { rolRevision: 'coordinador' }, loadComponent: () => import('./pages/common/paz-salvo-revision/paz-salvo-revision.component').then(m => m.PazSalvoRevisionComponent) },
          { path: 'reingreso-estudiante', data: { rolRevision: 'coordinador' }, loadComponent: () => import('./pages/common/reingreso-revision/reingreso-revision.component').then(m => m.ReingresoRevisionComponent) },
          { path: 'homologacion-asignaturas', data: { rolRevision: 'coordinador' }, loadComponent: () => import('./pages/common/homologacion-revision/homologacion-revision.component').then(m => m.HomologacionRevisionComponent) },
          { path: 'modulo-estadistico', loadComponent: () => import('./pages/common/modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent) },
          { path: 'historial-completo', loadComponent: () => import('./pages/common/historial-completo/historial-completo.component').then(m => m.HistorialCompletoComponent) },
          {
            path: 'cursos-intersemestrales',
            loadChildren: () =>
              import('./pages/common/cursos-intersemestrales/cursos-intersemestrales.routes')
                .then(m => m.CursosIntersemestralesGestionRoutes),
          },
        ]
      },

      // ==========================
      // Secretaria
      // ==========================
      {
        path: 'secretaria',
        canActivateChild: [authGuard, RoleGuard],
        data: { role: UserRole.SECRETARIA },
        children: [
          { path: 'paz-salvo', loadComponent: () => import('./pages/secretaria/paz-salvo/paz-salvo.component').then(m => m.SecretariaPazSalvoComponent) },
          { path: 'reingreso-estudiante', loadComponent: () => import('./pages/secretaria/reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent) },
          { path: 'homologacion-asignaturas', loadComponent: () => import('./pages/secretaria/homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent) },
        ]
      },

      // ==========================
      // Decano
      // ==========================
      { 
        path: 'decano/historial-completo', 
        loadComponent: () => import('./pages/common/historial-completo/historial-completo.component').then(m => m.HistorialCompletoComponent),
        canActivate: [authGuard, RoleGuard],
        data: { role: UserRole.DECANO }
      },
      { 
        path: 'decano/historial-completo/detalle/:id', 
        loadComponent: () => import('./pages/common/detalle-solicitud/detalle-solicitud.component').then(m => m.DetalleSolicitudComponent),
        canActivate: [authGuard, RoleGuard],
        data: { role: UserRole.DECANO }
      },
      { 
        path: 'decano/modulo-estadistico', 
        loadComponent: () => import('./pages/common/modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent),
        canActivate: [authGuard, RoleGuard],
        data: { role: UserRole.DECANO }
      },

      // ==========================
      // Admin
      // ==========================
      {
        path: 'admin',
        loadChildren: () =>
          import('./pages/admin/admin.routes').then(m => m.AdminRoutes),
        canActivate: [RoleGuard],
        data: { role: UserRole.ADMIN }
      },
    ],
  },

  // Ruta comodín
  { path: '**', redirectTo: 'login' },
];
