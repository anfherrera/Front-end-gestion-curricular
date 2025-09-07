// src/app/layout/sidebar/sidebar.config.ts

export type UserRole = 'admin' | 'funcionario' | 'coordinador' | 'secretaria' | 'estudiante';

export interface SidebarItem {
  label: string;
  icon: string;
  route?: string;  // Si existe, navega
  action?: string; // Si existe, ejecuta una función
  roles: UserRole[];
}

const ALL_ROLES: UserRole[] = ['admin', 'funcionario', 'coordinador', 'secretaria', 'estudiante'];
const ADMIN_AND_FUNCIONARIO: UserRole[] = ['admin', 'funcionario'];
const ADMIN_FUNC_COORD_SEC: UserRole[] = ['admin', 'funcionario', 'coordinador', 'secretaria'];

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Inicio',
    icon: 'home',
    route: '/home',
    roles: ALL_ROLES
  },

  // Paz y Salvo por rol
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/estudiante/paz-salvo',
    roles: ['estudiante']
  },
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/funcionario/paz-salvo',
    roles: ['funcionario']
  },
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/coordinador/paz-salvo',
    roles: ['coordinador']
  },
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/secretaria/paz-salvo',
    roles: ['secretaria']
  },

  {
    label: 'Pruebas ECAES',
    icon: 'assignment',
    route: '/pruebas-ecaes',
    roles: [...ADMIN_AND_FUNCIONARIO, 'estudiante']
  },
  {
    label: 'Cursos Intersemestrales',
    icon: 'school',
    route: '/cursos-intersemestrales',
    roles: [...ADMIN_AND_FUNCIONARIO, 'estudiante']
  },
  {
    label: 'Reingreso Estudiante',
    icon: 'person_add',
    route: '/reingreso-estudiante',
    roles: [...ADMIN_FUNC_COORD_SEC, 'estudiante']
  },
  {
    label: 'Homologación de Asignaturas',
    icon: 'sync_alt',
    route: '/homologacion-asignaturas',
    roles: [...ADMIN_FUNC_COORD_SEC, 'estudiante']
  },
  {
    label: 'Módulo Estadístico',
    icon: 'bar_chart',
    route: '/modulo-estadistico',
    roles: ['admin', 'funcionario', 'coordinador']
  },
  {
    label: 'Ajustes',
    icon: 'settings',
    route: '/ajustes',
    roles: ['admin']
  },

  // Cerrar sesión y minimizar
  {
    label: 'Cerrar sesión',
    icon: 'logout',
    action: 'logout',
    roles: ALL_ROLES
  },
  {
    label: 'Minimizar',
    icon: 'chevron_left',
    action: 'toggle',
    roles: ALL_ROLES
  }
];
