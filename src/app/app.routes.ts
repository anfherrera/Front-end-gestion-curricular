import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';

// 👈 Aquí puedes reemplazar HomeComponent por el componente correspondiente a cada proceso
// si más adelante creas componentes separados para cada uno.
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
      { path: 'paz-salvo', component: HomeComponent },              // Proceso Paz y Salvo
      { path: 'pruebas-ecaes', component: HomeComponent },          // Pruebas ECAES
      { path: 'cursos-intersemestrales', component: HomeComponent },// Cursos Intersemestrales
      { path: 'reingresos', component: HomeComponent },             // Gestionar Reingreso de Estudiante
      { path: 'homologaciones', component: HomeComponent },         // Gestionar Homologación de Asignaturas
      { path: 'estadisticas', component: HomeComponent },           // Módulo Estadístico
      { path: 'ajustes', component: HomeComponent },                // Ajustes
    ]
  },

  // Ruta comodín
  { path: '**', redirectTo: 'login' }
];
