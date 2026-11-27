import { Routes } from '@angular/router';

/** Rutas hijas de /secretaria; el guard de rol lo pone el padre en app.routes.ts. */
export const SecretariaRoutes: Routes = [
  {
    path: 'paz-salvo',
    title: 'Paz y salvo',
    loadComponent: () =>
      import('@features/paz-salvo/revision/secretaria/paz-salvo.component').then((m) => m.SecretariaPazSalvoComponent),
  },
  {
    path: 'reingreso-estudiante',
    title: 'Reingreso',
    loadComponent: () =>
      import('@features/reingreso/revision/secretaria/reingreso-estudiante.component').then(
        (m) => m.ReingresoEstudianteComponent
      ),
  },
  {
    path: 'homologacion-asignaturas',
    title: 'Homologación de asignaturas',
    loadComponent: () =>
      import('@features/homologacion/revision/secretaria/homologacion-asignaturas.component').then(
        (m) => m.HomologacionAsignaturasComponent
      ),
  },
];
