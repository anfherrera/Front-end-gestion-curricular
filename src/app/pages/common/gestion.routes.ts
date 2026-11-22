import { Route, Routes } from '@angular/router';

import { RolRevision } from '@core/models/solicitud-revision.model';

/*
 * Rutas hijas de /funcionario, /coordinador y /decano, que comparten pantallas.
 * El guard de rol lo pone cada padre en app.routes.ts.
 */

const moduloEstadistico: Route = {
  path: 'modulo-estadistico',
  loadComponent: () =>
    import('./modulo-estadistico/modulo-estadistico.component').then((m) => m.ModuloEstadisticoComponent),
};

const historialCompleto: Route = {
  path: 'historial-completo',
  loadComponent: () =>
    import('./historial-completo/historial-completo.component').then((m) => m.HistorialCompletoComponent),
};

/** Detalle de una solicitud, enlazado desde el historial completo (BUG-49). */
const detalleSolicitud: Route = {
  path: 'historial-completo/detalle/:id',
  loadComponent: () =>
    import('./detalle-solicitud/detalle-solicitud.component').then((m) => m.DetalleSolicitudComponent),
};

const cursosIntersemestrales: Route = {
  path: 'cursos-intersemestrales',
  loadChildren: () =>
    import('./cursos-intersemestrales/cursos-intersemestrales.routes').then(
      (m) => m.CursosIntersemestralesGestionRoutes
    ),
};

/** Paz y salvo, reingreso y homologación: la misma pantalla de revisión, con el rol en `data.rolRevision`. */
function rutasDeRevision(rolRevision: RolRevision): Routes {
  return [
    {
      path: 'paz-salvo',
      data: { rolRevision },
      loadComponent: () =>
        import('./paz-salvo-revision/paz-salvo-revision.component').then((m) => m.PazSalvoRevisionComponent),
    },
    {
      path: 'reingreso-estudiante',
      data: { rolRevision },
      loadComponent: () =>
        import('./reingreso-revision/reingreso-revision.component').then((m) => m.ReingresoRevisionComponent),
    },
    {
      path: 'homologacion-asignaturas',
      data: { rolRevision },
      loadComponent: () =>
        import('./homologacion-revision/homologacion-revision.component').then((m) => m.HomologacionRevisionComponent),
    },
  ];
}

export const FuncionarioRoutes: Routes = [
  ...rutasDeRevision('funcionario'),
  {
    path: 'pruebas-ecaes',
    loadComponent: () =>
      import('../funcionario/pruebas-ecaes/pruebas-ecaes.component').then((m) => m.PruebasEcaesFuncionarioComponent),
  },
  cursosIntersemestrales,
  moduloEstadistico,
  historialCompleto,
  detalleSolicitud,
];

export const CoordinadorRoutes: Routes = [
  ...rutasDeRevision('coordinador'),
  cursosIntersemestrales,
  moduloEstadistico,
  historialCompleto,
  detalleSolicitud,
];

/** El decano solo consulta: historial (con el detalle de una solicitud) y estadísticas. */
export const DecanoRoutes: Routes = [historialCompleto, detalleSolicitud, moduloEstadistico];
