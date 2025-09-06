import { Routes } from '@angular/router';

export const FuncionarioRoutes: Routes = [
  {
    path: 'paz-salvo',
    loadComponent: () => import('./paz-salvo/paz-salvo.component').then(m => m.PazSalvoComponent)
  },
  {
    path: 'pruebas-ecaes',
    loadComponent: () => import('./pruebas-ecaes/pruebas-ecaes.component').then(m => m.PruebasEcaesComponent)
  },
  {
    path: 'cursos-intersemestrales',
    loadComponent: () => import('./cursos-intersemestrales/cursos-intersemestrales.component').then(m => m.CursosIntersemestralesComponent)
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
  // Redirección por defecto al primer proceso
  { path: '', redirectTo: 'paz-salvo', pathMatch: 'full' }
];
