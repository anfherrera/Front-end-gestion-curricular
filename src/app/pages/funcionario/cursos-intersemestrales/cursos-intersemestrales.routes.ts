import { Routes } from '@angular/router';
import { CursosIntersemestralesComponent } from './cursos-intersemestrales.component';
import { DashboardFuncionarioComponent } from './dashboard/dashboard.component';
import { GestionarCursosComponent } from './gestionar-cursos/gestionar-cursos.component';
import { PreinscribirEstudiantesComponent } from './preinscribir-estudiantes/preinscribir-estudiantes.component';
import { InscribirEstudiantesComponent } from './inscribir-estudiantes/inscribir-estudiantes.component';
import { VisualizarSolicitudesComponent } from './visualizar-solicitudes/visualizar-solicitudes.component';

export const CursosIntersemestralesFuncionarioRoutes: Routes = [
  {
    path: '',
    component: CursosIntersemestralesComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardFuncionarioComponent },
      { path: 'gestionar', component: GestionarCursosComponent },
      { path: 'preinscribir', component: PreinscribirEstudiantesComponent },
      { path: 'inscribir', component: InscribirEstudiantesComponent },
      { path: 'solicitudes', component: VisualizarSolicitudesComponent },
    ],
  },
];
