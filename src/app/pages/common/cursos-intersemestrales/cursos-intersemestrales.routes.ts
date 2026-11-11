import { Routes } from '@angular/router';
import { CursosIntersemestralesGestionComponent } from './cursos-intersemestrales.component';
import { DashboardCursosIntersemestralesComponent } from './dashboard/dashboard.component';
import { GestionarCursosComponent } from './gestionar-cursos/gestionar-cursos.component';
import { PreinscribirEstudiantesComponent } from './preinscribir-estudiantes/preinscribir-estudiantes.component';
import { InscribirEstudiantesComponent } from './inscribir-estudiantes/inscribir-estudiantes.component';
import { VisualizarSolicitudesComponent } from './visualizar-solicitudes/visualizar-solicitudes.component';

/**
 * Gestión de cursos intersemestrales para el personal (funcionario y coordinador).
 * Ambos roles cargan estas mismas rutas desde app.routes.ts.
 */
export const CursosIntersemestralesGestionRoutes: Routes = [
  {
    path: '',
    component: CursosIntersemestralesGestionComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardCursosIntersemestralesComponent },
      { path: 'gestionar', component: GestionarCursosComponent },
      { path: 'preinscribir', component: PreinscribirEstudiantesComponent },
      { path: 'inscribir', component: InscribirEstudiantesComponent },
      { path: 'solicitudes', component: VisualizarSolicitudesComponent },
    ],
  },
];
