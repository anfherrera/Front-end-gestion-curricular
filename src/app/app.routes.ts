import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'roles', component: HomeComponent }, // temporal
      { path: 'empresas', component: HomeComponent } // temporal
    ]
  }
];
