import { Routes } from '@angular/router';

export const AdminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'manage-users',
    loadComponent: () =>
      import('./manage-users/manage-users.component').then(m => m.ManageUsersComponent)
  },
  {
    path: 'manage-users/crear',
    loadComponent: () =>
      import('./manage-users/form-usuario/form-usuario.component').then(m => m.FormUsuarioComponent)
  },
  {
    path: 'manage-users/editar/:id',
    loadComponent: () =>
      import('./manage-users/form-usuario/form-usuario.component').then(m => m.FormUsuarioComponent)
  },
  {
    path: 'manage-roles',
    loadComponent: () =>
      import('./manage-roles/manage-roles.component').then(m => m.ManageRolesComponent)
  },
  // Docentes
  {
    path: 'docentes',
    loadComponent: () =>
      import('./gestion-docentes/lista-docentes/lista-docentes.component').then(m => m.ListaDocentesComponent)
  },
  {
    path: 'docentes/crear',
    loadComponent: () =>
      import('./gestion-docentes/form-docente/form-docente.component').then(m => m.FormDocenteComponent)
  },
  {
    path: 'docentes/editar/:id',
    loadComponent: () =>
      import('./gestion-docentes/form-docente/form-docente.component').then(m => m.FormDocenteComponent)
  },
  // Programas
  {
    path: 'programas',
    loadComponent: () =>
      import('./gestion-programas/lista-programas/lista-programas.component').then(m => m.ListaProgramasComponent)
  },
  {
    path: 'programas/crear',
    loadComponent: () =>
      import('./gestion-programas/form-programa/form-programa.component').then(m => m.FormProgramaComponent)
  },
  {
    path: 'programas/editar/:id',
    loadComponent: () =>
      import('./gestion-programas/form-programa/form-programa.component').then(m => m.FormProgramaComponent)
  },
  // Redirección por defecto
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
