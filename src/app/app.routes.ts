import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout/layout.component';

export const routes: Routes = [
  // Redirección por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login
  { path: 'login', component: LoginComponent },

  // Home envuelto en Layout (header + sidenav + footer)
  { path: 'home', component: LayoutComponent },

  // Otras rutas (temporalmente usando HomeComponent)
  { path: 'roles', component: HomeComponent },
  { path: 'empresas', component: HomeComponent },

  // Ruta comodín (opcional) para cualquier URL no definida
  { path: '**', redirectTo: 'login' }
];
