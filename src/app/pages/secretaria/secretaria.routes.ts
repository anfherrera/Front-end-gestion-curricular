import { Routes } from '@angular/router';

/** Rutas hijas de /secretaria; el guard de rol lo pone el padre en app.routes.ts. */
export const SecretariaRoutes: Routes = [
  {
    path: 'paz-salvo',
    loadComponent: () => import('./paz-salvo/paz-salvo.component').then((m) => m.SecretariaPazSalvoComponent),
  },
  {
    path: 'reingreso-estudiante',
    loadComponent: () =>
      import('./reingreso-estudiante/reingreso-estudiante.component').then((m) => m.ReingresoEstudianteComponent),
  },
  {
    path: 'homologacion-asignaturas',
    loadComponent: () =>
      import('./homologacion-asignaturas/homologacion-asignaturas.component').then(
        (m) => m.HomologacionAsignaturasComponent
      ),
  },
];
