import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/enums/roles.enum';

export const CoordinadorRoutes: Routes = [
  {
    path: 'paz-salvo',
    loadComponent: () => import('./paz-salvo/paz-salvo.component').then(m => m.PazSalvoCoordinadorComponent)
  },
  {
    path: 'reingreso-estudiante',
    loadComponent: () => import('./reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent)
  },
  {
    path: 'homologacion-asignaturas',
    loadComponent: () => import('./homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent)
  },
  {
    path: 'modulo-estadistico',
    loadComponent: () => import('./modulo-estadistico/modulo-estadistico.component').then(m => m.ModuloEstadisticoComponent)
  },
  {
    path: 'cursos-intersemestrales',
    loadChildren: () =>
      import('./cursos-intersemestrales/cursos-intersemestrales.routes')
        .then(m => m.CursosIntersemestralesCoordinadorRoutes),
  },
  {
    path: 'historial-completo',
    loadComponent: () =>
      import('../common/historial-completo/historial-completo.component').then(m => m.HistorialCompletoComponent),
    canActivate: [authGuard, RoleGuard],
    data: { role: UserRole.COORDINADOR }
  },
  { path: '', redirectTo: 'paz-salvo', pathMatch: 'full' }
];
