// src/app/layout/sidebar/sidebar.config.ts
import { UserRole } from "../../core/enums/roles.enum";

export interface SidebarItem {
  label: string;
  icon: string;
  route?: string;
  action?: string;
  roles: UserRole[];
}

const ALL_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.FUNCIONARIO,
  UserRole.COORDINADOR,
  UserRole.SECRETARIA,
  UserRole.ESTUDIANTE
];

const ADMIN_AND_FUNCIONARIO: UserRole[] = [UserRole.ADMIN, UserRole.FUNCIONARIO];
const ADMIN_FUNC_COORD_SEC: UserRole[] = [
  UserRole.ADMIN,
  UserRole.FUNCIONARIO,
  UserRole.COORDINADOR,
  UserRole.SECRETARIA
];

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Inicio', icon: 'home', route: '/home', roles: ALL_ROLES },

  // Paz y Salvo
  { label: 'Proceso Paz y Salvo', icon: 'check_circle', route: '/estudiante/paz-salvo', roles: [UserRole.ESTUDIANTE] },
  { label: 'Proceso Paz y Salvo', icon: 'check_circle', route: '/funcionario/paz-salvo', roles: [UserRole.FUNCIONARIO] },
  { label: 'Proceso Paz y Salvo', icon: 'check_circle', route: '/coordinador/paz-salvo', roles: [UserRole.COORDINADOR] },
  { label: 'Proceso Paz y Salvo', icon: 'check_circle', route: '/secretaria/paz-salvo', roles: [UserRole.SECRETARIA] },

  // Pruebas ECAES
  { label: 'Pruebas ECAES', icon: 'assignment', route: '/estudiante/pruebas-ecaes', roles: [UserRole.ESTUDIANTE] },
  { label: 'Pruebas ECAES', icon: 'assignment', route: '/funcionario/pruebas-ecaes', roles: [UserRole.FUNCIONARIO, UserRole.ADMIN] },

  // Cursos Intersemestrales
  { label: 'Cursos Intersemestrales', icon: 'school', route: '/estudiante/cursos-intersemestrales', roles: [UserRole.ESTUDIANTE] },
  { label: 'Cursos Intersemestrales', icon: 'school', route: '/funcionario/cursos-intersemestrales', roles: [UserRole.FUNCIONARIO, UserRole.ADMIN] },

  // Reingreso Estudiante
  { label: 'Reingreso Estudiante', icon: 'person_add', route: '/estudiante/reingreso-estudiante', roles: [UserRole.ESTUDIANTE] },
  { label: 'Reingreso Estudiante', icon: 'person_add', route: '/funcionario/reingreso-estudiante', roles: [UserRole.FUNCIONARIO] },
  { label: 'Reingreso Estudiante', icon: 'person_add', route: '/coordinador/reingreso-estudiante', roles: [UserRole.COORDINADOR] },
  { label: 'Reingreso Estudiante', icon: 'person_add', route: '/secretaria/reingreso-estudiante', roles: [UserRole.SECRETARIA] },

  // Homologación de Asignaturas
  { label: 'Homologación de Asignaturas', icon: 'sync_alt', route: '/estudiante/homologacion-asignaturas', roles: [UserRole.ESTUDIANTE] },
  { label: 'Homologación de Asignaturas', icon: 'sync_alt', route: '/funcionario/homologacion-asignaturas', roles: [UserRole.FUNCIONARIO] },
  { label: 'Homologación de Asignaturas', icon: 'sync_alt', route: '/coordinador/homologacion-asignaturas', roles: [UserRole.COORDINADOR] },
  { label: 'Homologación de Asignaturas', icon: 'sync_alt', route: '/secretaria/homologacion-asignaturas', roles: [UserRole.SECRETARIA] },

  // Módulo Estadístico
  { label: 'Módulo Estadístico', icon: 'bar_chart', route: '/funcionario/modulo-estadistico', roles: [UserRole.FUNCIONARIO, UserRole.COORDINADOR, UserRole.ADMIN] },
  { label: 'Módulo Estadístico', icon: 'bar_chart', route: '/coordinador/modulo-estadistico', roles: [UserRole.COORDINADOR, UserRole.ADMIN] },

  { label: 'Ajustes', icon: 'settings', route: '/ajustes', roles: [UserRole.ADMIN] },

  // Cerrar sesión y minimizar
  { label: 'Cerrar sesión', icon: 'logout', action: 'logout', roles: ALL_ROLES },
  { label: 'Minimizar', icon: 'chevron_left', action: 'toggle', roles: ALL_ROLES }
];
