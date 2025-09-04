import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { PazSalvoComponent } from './pages/paz-salvo/paz-salvo.component';
import { ModuloEstadisticoComponent } from './pages/modulo-estadistico/modulo-estadistico.component';
import { CursosIntersemestralesComponent } from './pages/cursos-intersemestrales/cursos-intersemestrales.component';
import { PruebasEcaesComponent } from './pages/pruebas-ecaes/pruebas-ecaes.component';
import { ReingresoEstudianteComponent } from './pages/reingreso-estudiante/reingreso-estudiante.component';
import { HomologacionAsignaturasComponent } from './pages/homologacion-asignaturas/homologacion-asignaturas.component';
import { AjustesComponent } from './pages/ajustes/ajustes.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Pública
  { path: 'login', component: LoginComponent },

  // Privadas (dentro del layout) protegidas por guard
  {
  path: '',
  component: LayoutComponent,
  canActivate: [authGuard],
  children: [
    { path: '', redirectTo: 'home', pathMatch: 'full' }, // 👈 ruta por defecto
    { path: 'home', component: HomeComponent },   
    { path: 'paz-salvo', component: PazSalvoComponent },
    { path: 'pruebas-ecaes', component: PruebasEcaesComponent },
    { path: 'cursos-intersemestrales', component: CursosIntersemestralesComponent },
    { path: 'reingreso-estudiante', component: ReingresoEstudianteComponent },
    { path: 'homologacion-asignaturas', component: HomologacionAsignaturasComponent },
    { path: 'modulo-estadistico', component: ModuloEstadisticoComponent },
    { path: 'ajustes', component: AjustesComponent }
  ]
},

  // Ruta comodín
  { path: '**', redirectTo: 'login' }
];
