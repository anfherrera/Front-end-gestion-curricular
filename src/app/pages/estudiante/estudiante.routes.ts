import { Routes } from '@angular/router';

/** Rutas hijas de /estudiante; el guard de rol lo pone el padre en app.routes.ts. */
export const EstudianteRoutes: Routes = [
  {
    path: 'paz-salvo',
    loadComponent: () =>
      import('../../features/paz-salvo/estudiante/paz-salvo.component').then((m) => m.PazSalvoComponent),
  },
  {
    path: 'pruebas-ecaes',
    loadComponent: () =>
      import('../../features/pruebas-ecaes/estudiante/pruebas-ecaes.component').then((m) => m.PruebasEcaesComponent),
  },
  {
    path: 'cursos-intersemestrales',
    loadChildren: () =>
      import('../../features/cursos-intersemestrales/estudiante/cursos-intersemestrales.routes').then(
        (m) => m.cursosIntersemestralesRoutes
      ),
  },
  {
    path: 'homologacion-asignaturas',
    loadComponent: () =>
      import('../../features/homologacion/estudiante/homologacion-asignaturas.component').then(
        (m) => m.HomologacionAsignaturasComponent
      ),
  },
  {
    path: 'reingreso-estudiante',
    loadComponent: () =>
      import('../../features/reingreso/estudiante/reingreso-estudiante.component').then(
        (m) => m.ReingresoEstudianteComponent
      ),
  },
];
