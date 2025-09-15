// funcionario/cursos-intersemestrales/cursos-intersemestrales.routes.ts
import { Routes } from '@angular/router';
import { CursosIntersemestralesComponent } from './cursos-intersemestrales.component';

export const CursosIntersemestralesFuncionarioRoutes: Routes = [
  {
    path: '',
    component: CursosIntersemestralesComponent,
    children: [
      {
        path: 'gestionar',
        loadComponent: () =>
          import('./gestionar-cursos/gestionar-cursos.component').then(
            (m) => m.GestionarCursosComponent
          ),
      },
      {
        path: 'ofertar',
        loadComponent: () =>
          import('./oferta-curso/oferta-curso.component').then(
            (m) => m.OfertaCursoComponent
          ),
      },
      {
        path: 'publicar',
        loadComponent: () =>
          import('./publicar-curso/publicar-curso.component').then(
            (m) => m.PublicarCursoComponent
          ),
      },
      {
        path: 'preinscribir',
        loadComponent: () =>
          import('./preinscribir-estudiantes/preinscribir-estudiantes.component').then(
            (m) => m.PreinscribirEstudiantesComponent
          ),
      },
      {
        path: 'estudio-academico',
        loadComponent: () =>
          import('./estudio-academico/estudio-academico.component').then(
            (m) => m.EstudioAcademicoComponent
          ),
      },
      {
        path: 'inscribir',
        loadComponent: () =>
          import('./inscribir-estudiantes/inscribir-estudiantes.component').then(
            (m) => m.InscribirEstudiantesComponent
          ),
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./visualizar-solicitudes/visualizar-solicitudes.component').then(
            (m) => m.VisualizarSolicitudesComponent
          ),
      },
      { path: '', redirectTo: 'gestionar', pathMatch: 'full' },
    ],
  },
];
