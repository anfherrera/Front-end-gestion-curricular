// src/app/pages/estudiante/cursos-intersemestrales/cursos-intersemestrales.routes.ts
import { Routes } from '@angular/router';
import { CursosIntersemestralesComponent } from './cursos-intersemestrales.component';
import { SolicitudesComponent } from './solicitudes/solicitudes.component';
import { InscripcionesComponent } from './inscripciones/inscripciones.component';
import { CursosOfertadosComponent } from './cursos-ofertados/cursos-ofertados.component';
import { CursosPreinscripcionComponent } from './cursos-preinscripcion/cursos-preinscripcion.component';
import { VerSolicitudComponent } from './ver-solicitud/ver-solicitud.component';

export const cursosIntersemestralesRoutes: Routes = [
  {
    path: '',
    component: CursosIntersemestralesComponent,
    children: [
      { path: '', redirectTo: 'solicitudes', pathMatch: 'full' },
      { path: 'solicitudes', component: SolicitudesComponent },
      { path: 'inscripciones', component: InscripcionesComponent },
      { path: 'cursos-ofertados', component: CursosOfertadosComponent },
      { path: 'cursos-preinscripcion', component: CursosPreinscripcionComponent },
      { path: 'ver-solicitud', component: VerSolicitudComponent },
    ]
  }
];
