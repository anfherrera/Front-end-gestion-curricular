import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { ModuloEstadisticoComponent } from './pages/modulo-estadistico/modulo-estadistico.component';
import { CursosIntersemestralesComponent } from './pages/cursos-intersemestrales/cursos-intersemestrales.component';
import { PruebasEcaesComponent } from './pages/pruebas-ecaes/pruebas-ecaes.component';
import { ReingresoEstudianteComponent } from './pages/reingreso-estudiante/reingreso-estudiante.component';
import { HomologacionAsignaturasComponent } from './pages/homologacion-asignaturas/homologacion-asignaturas.component';
import { AjustesComponent } from './pages/ajustes/ajustes.component';

// Paz y Salvo por rol
import { PazSalvoEstudianteComponent } from './pages/paz-salvo/estudiante/paz-salvo-estudiante.component';
import { PazSalvoFuncionarioComponent } from './pages/paz-salvo/funcionario/paz-salvo-funcionario.component';
import { PazSalvoCoordinadorComponent } from './pages/paz-salvo/coordinador/paz-salvo-coordinador.component';
import { PazSalvoSecretariaComponent } from './pages/paz-salvo/secretaria/paz-salvo-secretaria..component';
import { RoleGuard } from './core/guards/role.guard';

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
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },

      // Paz y Salvo por rol con RoleGuard
      { 
        path: 'paz-salvo/estudiante', 
        component: PazSalvoEstudianteComponent,
        canActivate: [authGuard, RoleGuard],
        data: { role: 'estudiante' }
      },
      { 
        path: 'paz-salvo/funcionario', 
        component: PazSalvoFuncionarioComponent,
        canActivate: [authGuard, RoleGuard],
        data: { role: 'funcionario' }
      },
      { 
        path: 'paz-salvo/coordinador', 
        component: PazSalvoCoordinadorComponent,
        canActivate: [authGuard, RoleGuard],
        data: { role: 'coordinador' }
      },
      { 
        path: 'paz-salvo/secretaria', 
        component: PazSalvoSecretariaComponent,
        canActivate: [authGuard, RoleGuard],
        data: { role: 'secretaria' }
      },

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
