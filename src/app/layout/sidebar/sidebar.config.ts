// src/app/layout/sidebar/sidebar.config.ts
import { UserRole } from "../../core/models/roles.ennum";

export interface SidebarItem {
  label: string;
  icon: string;
  route?: string;  // Si existe, navega
  action?: string; // Si existe, ejecuta una función
  roles: UserRole[];
}

// Arrays de roles para filtrado rápido
const ALL_ROLES: UserRole[] = [
  UserRole.ADMIN, 
  UserRole.FUNCIONARIO, 
  UserRole.COORDINADOR, 
  UserRole.SECRETARIA, 
  UserRole.ESTUDIANTE
];

const ADMIN_AND_FUNCIONARIO: UserRole[] = [
  UserRole.ADMIN, 
  UserRole.FUNCIONARIO
];

const ADMIN_FUNC_COORD_SEC: UserRole[] = [
  UserRole.ADMIN, 
  UserRole.FUNCIONARIO, 
  UserRole.COORDINADOR, 
  UserRole.SECRETARIA
];

// Items del sidebar
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
    roles: [UserRole.ESTUDIANTE]
  },
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/funcionario/paz-salvo',
    roles: [UserRole.FUNCIONARIO]
  },
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/coordinador/paz-salvo',
    roles: [UserRole.COORDINADOR]
  },
  {
    label: 'Proceso Paz y Salvo',
    icon: 'check_circle',
    route: '/secretaria/paz-salvo',
    roles: [UserRole.SECRETARIA]
  },

  {
    label: 'Pruebas ECAES',
    icon: 'assignment',
    route: '/pruebas-ecaes',
    roles: [...ADMIN_AND_FUNCIONARIO, UserRole.ESTUDIANTE]
  },
  {
    label: 'Cursos Intersemestrales',
    icon: 'school',
    route: '/cursos-intersemestrales',
    roles: [...ADMIN_AND_FUNCIONARIO, UserRole.ESTUDIANTE]
  },
  {
    label: 'Reingreso Estudiante',
    icon: 'person_add',
    route: '/reingreso-estudiante',
    roles: [...ADMIN_FUNC_COORD_SEC, UserRole.ESTUDIANTE]
  },
  {
    label: 'Homologación de Asignaturas',
    icon: 'sync_alt',
    route: '/homologacion-asignaturas',
    roles: [...ADMIN_FUNC_COORD_SEC, UserRole.ESTUDIANTE]
  },
  {
    label: 'Módulo Estadístico',
    icon: 'bar_chart',
    route: '/modulo-estadistico',
    roles: [UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.COORDINADOR]
  },
  {
    label: 'Ajustes',
    icon: 'settings',
    route: '/ajustes',
    roles: [UserRole.ADMIN]
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
