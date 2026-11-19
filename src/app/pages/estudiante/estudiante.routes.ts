import { Routes } from '@angular/router';

/** Rutas hijas de /estudiante; el guard de rol lo pone el padre en app.routes.ts. */
export const EstudianteRoutes: Routes = [
  {
    path: 'paz-salvo',
    loadComponent: () => import('./paz-salvo/paz-salvo.component').then((m) => m.PazSalvoComponent),
  },
  {
    path: 'pruebas-ecaes',
    loadComponent: () => import('./pruebas-ecaes/pruebas-ecaes.component').then((m) => m.PruebasEcaesComponent),
  },
  {
    path: 'cursos-intersemestrales',
    loadChildren: () =>
      import('./cursos-intersemestrales/cursos-intersemestrales.routes').then((m) => m.cursosIntersemestralesRoutes),
  },
  {
    path: 'homologacion-asignaturas',
    loadComponent: () =>
      import('./homologacion-asignaturas/homologacion-asignaturas.component').then(
        (m) => m.HomologacionAsignaturasComponent
      ),
  },
  {
    path: 'reingreso-estudiante',
    loadComponent: () =>
      import('./reingreso-estudiante/reingreso-estudiante.component').then((m) => m.ReingresoEstudianteComponent),
  },
];
