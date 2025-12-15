// funcionario.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/enums/roles.enum';

export const FuncionarioRoutes: Routes = [
  {
    path: 'paz-salvo',
    loadComponent: () =>
      import('./paz-salvo/paz-salvo.component').then(m => m.PazSalvoComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'pruebas-ecaes',
    loadComponent: () =>
      import('./pruebas-ecaes/pruebas-ecaes.component').then(m => m.PruebasEcaesFuncionarioComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'cursos-intersemestrales',
    loadChildren: () =>
      import('./cursos-intersemestrales/cursos-intersemestrales.routes')
        .then(m => m.CursosIntersemestralesFuncionarioRoutes),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'reingreso-estudiante',
    loadComponent: () =>
      import('./reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'homologacion-asignaturas',
    loadComponent: () =>
      import('./homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'modulo-estadistico',
    loadComponent: () =>
      import('./modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'historial-completo',
    loadComponent: () =>
      import('../common/historial-completo/historial-completo.component').then(m => m.HistorialCompletoComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  {
    path: 'historial-completo/detalle/:id',
    loadComponent: () =>
      import('../common/detalle-solicitud/detalle-solicitud.component').then(m => m.DetalleSolicitudComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.FUNCIONARIO }
  },
  { path: '', redirectTo: 'paz-salvo', pathMatch: 'full' }
];
