import { Routes } from '@angular/router';

export const AdminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'manage-users',
    loadComponent: () => import('./manage-users/manage-users.component').then(m => m.ManageUsersComponent)
  },
  {
    path: 'manage-roles',
    loadComponent: () => import('./manage-roles/manage-roles.component').then(m => m.ManageRolesComponent)
  },
  {
    path: 'manage-processes',
    loadComponent: () => import('./manage-processes/manage-processes.component').then(m => m.ManageProcessesComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
