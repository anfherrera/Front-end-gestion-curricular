import { Routes } from '@angular/router';

export const AdminRoutes: Routes = [
  {
    path: 'dashboard',
    title: 'Panel de administración',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'manage-users',
    title: 'Gestión de usuarios',
    loadComponent: () => import('./manage-users/manage-users.component').then((m) => m.ManageUsersComponent),
  },
  {
    path: 'manage-users/crear',
    title: 'Crear usuario',
    loadComponent: () =>
      import('./manage-users/form-usuario/form-usuario.component').then((m) => m.FormUsuarioComponent),
  },
  {
    path: 'manage-users/editar/:id',
    title: 'Editar usuario',
    loadComponent: () =>
      import('./manage-users/form-usuario/form-usuario.component').then((m) => m.FormUsuarioComponent),
  },
  {
    path: 'manage-roles',
    title: 'Gestión de roles',
    loadComponent: () => import('./manage-roles/manage-roles.component').then((m) => m.ManageRolesComponent),
  },
  // Docentes
  {
    path: 'docentes',
    title: 'Gestión de docentes',
    loadComponent: () =>
      import('./gestion-docentes/lista-docentes/lista-docentes.component').then((m) => m.ListaDocentesComponent),
  },
  {
    path: 'docentes/crear',
    title: 'Crear docente',
    loadComponent: () =>
      import('./gestion-docentes/form-docente/form-docente.component').then((m) => m.FormDocenteComponent),
  },
  {
    path: 'docentes/editar/:id',
    title: 'Editar docente',
    loadComponent: () =>
      import('./gestion-docentes/form-docente/form-docente.component').then((m) => m.FormDocenteComponent),
  },
  // Programas
  {
    path: 'programas',
    title: 'Gestión de programas',
    loadComponent: () =>
      import('./gestion-programas/lista-programas/lista-programas.component').then((m) => m.ListaProgramasComponent),
  },
  {
    path: 'programas/crear',
    title: 'Crear programa',
    loadComponent: () =>
      import('./gestion-programas/form-programa/form-programa.component').then((m) => m.FormProgramaComponent),
  },
  {
    path: 'programas/editar/:id',
    title: 'Editar programa',
    loadComponent: () =>
      import('./gestion-programas/form-programa/form-programa.component').then((m) => m.FormProgramaComponent),
  },
  // Administración de Formatos Institucionales
  {
    path: 'formatos-institucionales',
    title: 'Formatos institucionales',
    loadComponent: () =>
      import('./formatos-institucionales/formatos-institucionales.component').then(
        (m) => m.FormatosInstitucionalesComponent
      ),
  },
  // Redirección por defecto
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
