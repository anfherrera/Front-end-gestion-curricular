import { Routes } from '@angular/router';

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
  { path: '', redirectTo: 'paz-salvo', pathMatch: 'full' }
];
