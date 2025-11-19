import { Routes } from '@angular/router';
import { CursosIntersemestralesCoordinadorComponent } from './cursos-intersemestrales.component';
import { DashboardCoordinadorComponent } from './dashboard/dashboard.component';
import { GestionarCursosComponent } from './gestionar-cursos/gestionar-cursos.component';
import { PreinscribirEstudiantesComponent } from './preinscribir-estudiantes/preinscribir-estudiantes.component';
import { InscribirEstudiantesComponent } from './inscribir-estudiantes/inscribir-estudiantes.component';
import { VisualizarSolicitudesComponent } from './visualizar-solicitudes/visualizar-solicitudes.component';

export const CursosIntersemestralesCoordinadorRoutes: Routes = [
  {
    path: '',
    component: CursosIntersemestralesCoordinadorComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardCoordinadorComponent },
      { path: 'gestionar', component: GestionarCursosComponent },
      { path: 'preinscribir', component: PreinscribirEstudiantesComponent },
      { path: 'inscribir', component: InscribirEstudiantesComponent },
      { path: 'solicitudes', component: VisualizarSolicitudesComponent },
    ],
  },
];
