import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { CommonRoutes } from '../common/common.routes';

export const EstudianteRoutes: Routes = [
  {
    path: 'estudiante/paz-salvo',
    loadComponent: () => import('./paz-salvo/paz-salvo.component').then(m => m.PazSalvoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estudiante/pruebas-ecaes',
    loadComponent: () => import('./pruebas-ecaes/pruebas-ecaes.component').then(m => m.PruebasEcaesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estudiante/cursos-intersemestrales',
    loadChildren: () =>
      import('./cursos-intersemestrales/cursos-intersemestrales.routes')
        .then(m => m.cursosIntersemestralesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'estudiante/homologacion-asignaturas',
    loadComponent: () => import('./homologacion-asignaturas/homologacion-asignaturas.component').then(m => m.HomologacionAsignaturasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estudiante/reingreso-estudiante',
    loadComponent: () => import('./reingreso-estudiante/reingreso-estudiante.component').then(m => m.ReingresoEstudianteComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'estudiante/paz-salvo', pathMatch: 'full' }
];
