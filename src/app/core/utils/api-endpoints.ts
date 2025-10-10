import { environment } from '../../../environments/environment';

export class ApiEndpoints {
  private static readonly BASE_URL = environment.apiUrl;

  // ===== AUTENTICACIÓN =====
  static readonly AUTH = {
    LOGIN: `${this.BASE_URL}/usuarios/login`, // Endpoint real del backend
    REFRESH: `${this.BASE_URL}/auth/refresh`,
    LOGOUT: `${this.BASE_URL}/auth/logout`,
    PROFILE: `${this.BASE_URL}/auth/profile`
  };

  // ===== USUARIOS =====
  static readonly USUARIOS = {
    BASE: `${this.BASE_URL}/usuarios`,
    BY_ID: (id: string) => `${this.BASE_URL}/usuarios/${id}`,
    BY_EMAIL: (email: string) => `${this.BASE_URL}/usuarios/email/${email}`,
    BY_ROLE: (role: string) => `${this.BASE_URL}/usuarios/role/${role}`,
    UPDATE: (id: string) => `${this.BASE_URL}/usuarios/${id}`,
    DELETE: (id: string) => `${this.BASE_URL}/usuarios/${id}`
  };

  // ===== PROCESOS =====
  static readonly PROCESOS = {
    BASE: `${this.BASE_URL}/procesos`,
    BY_ID: (id: string) => `${this.BASE_URL}/procesos/${id}`,
    BY_ESTADO: (estado: string) => `${this.BASE_URL}/procesos/estado/${estado}`,
    BY_USUARIO: (usuarioId: string) => `${this.BASE_URL}/procesos/usuario/${usuarioId}`,
    UPDATE: (id: string) => `${this.BASE_URL}/procesos/${id}`,
    DELETE: (id: string) => `${this.BASE_URL}/procesos/${id}`
  };

  // ===== CURSOS INTERSEMESTRALES =====
  static readonly CURSOS_INTERSEMESTRALES = {
    BASE: `${this.BASE_URL}/cursos-intersemestrales`,
    BY_ID: (id: string) => `${this.BASE_URL}/cursos-intersemestrales/${id}`,
    BY_ESTUDIANTE: (estudianteId: string) => `${this.BASE_URL}/cursos-intersemestrales/estudiante/${estudianteId}`,
    BY_ESTADO: (estado: string) => `${this.BASE_URL}/cursos-intersemestrales/estado/${estado}`,
    APROBAR: (id: string) => `${this.BASE_URL}/cursos-intersemestrales/${id}/aprobar`,
    RECHAZAR: (id: string) => `${this.BASE_URL}/cursos-intersemestrales/${id}/rechazar`,
    DOCUMENTOS: (id: string) => `${this.BASE_URL}/cursos-intersemestrales/${id}/documentos`,
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/cursos-intersemestrales/${id}/documentos/upload`,
    
    // ===== CURSOS DE VERANO =====
    CURSOS_VERANO: {
      // Endpoints principales
      DISPONIBLES: `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/disponibles`, // Para estudiantes
      TODOS: `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/todos`, // Para funcionarios
      
      // Endpoints de gestión (CRUD)
      GESTION: `${this.BASE_URL}/cursos-intersemestrales/cursos-verano`, // Para crear, actualizar, eliminar
      
      // Endpoints específicos por estado
      PREINSCRIPCION: `${this.BASE_URL}/cursos-intersemestrales/cursos/preinscripcion`,
      INSCRIPCION: `${this.BASE_URL}/cursos-intersemestrales/cursos/inscripcion`,
      
      // Endpoints de gestión
      PREINSCRIPCIONES: `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/preinscripciones`,
      INSCRIPCIONES: `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/inscripciones`,
      SOLICITUDES: `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/solicitudes`,
      CURSOS_DISPONIBLES: `${this.BASE_URL}/cursos-intersemestrales/materias-disponibles`,
      CONDICIONES: `${this.BASE_URL}/cursos-intersemestrales/condiciones-solicitud`,
      SOLICITUDES_CURSO_NUEVO: `${this.BASE_URL}/cursos-intersemestrales/solicitudes-curso-nuevo`,
      SOLICITUDES_CURSO_NUEVO_USUARIO: (idUsuario: number) => `${this.BASE_URL}/cursos-intersemestrales/solicitudes-curso-nuevo/usuario/${idUsuario}`,
      PREINSCRIPCIONES_CURSO: (idCurso: number) => `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/preinscripciones/curso/${idCurso}`,
      INSCRIPCIONES_CURSO: (idCurso: number) => `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/inscripciones/curso/${idCurso}`,
      ESTUDIANTES_ELEGIBLES: (idCurso: number) => `${this.BASE_URL}/cursos-intersemestrales/inscripciones/estudiantes-elegibles/${idCurso}`,
      APROBAR_PREINSCRIPCION: (id: number) => `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/preinscripciones/${id}/aprobar`,
      RECHAZAR_PREINSCRIPCION: (id: number) => `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/preinscripciones/${id}/rechazar`,
      VALIDAR_PAGO: (id: number) => `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/inscripciones/${id}/validar-pago`,
      COMPLETAR_INSCRIPCION: (id: number) => `${this.BASE_URL}/cursos-intersemestrales/cursos-verano/inscripciones/${id}/completar`,
      
      // Nuevos endpoints de permisos
      PERMISOS_ESTADO: (estado: string, rol: string) => `${this.BASE_URL}/cursos-intersemestrales/permisos-estado/${estado}/${rol}`
    }
  };

  // ===== HOMOLOGACIÓN DE ASIGNATURAS =====
  static readonly HOMOLOGACION_ASIGNATURAS = {
    BASE: `${this.BASE_URL}/homologacion-asignaturas`,
    BY_ID: (id: string) => `${this.BASE_URL}/homologacion-asignaturas/${id}`,
    BY_ESTUDIANTE: (estudianteId: string) => `${this.BASE_URL}/homologacion-asignaturas/estudiante/${estudianteId}`,
    BY_ESTADO: (estado: string) => `${this.BASE_URL}/homologacion-asignaturas/estado/${estado}`,
    APROBAR: (id: string) => `${this.BASE_URL}/homologacion-asignaturas/${id}/aprobar`,
    RECHAZAR: (id: string) => `${this.BASE_URL}/homologacion-asignaturas/${id}/rechazar`,
    DOCUMENTOS: (id: string) => `${this.BASE_URL}/homologacion-asignaturas/${id}/documentos`,
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/homologacion-asignaturas/${id}/documentos/upload`
  };

  // ===== PAZ Y SALVO =====
  static readonly PAZ_SALVO = {
    BASE: `${this.BASE_URL}/paz-salvo`,
    BY_ID: (id: string) => `${this.BASE_URL}/paz-salvo/${id}`,
    BY_ESTUDIANTE: (estudianteId: string) => `${this.BASE_URL}/paz-salvo/estudiante/${estudianteId}`,
    BY_ESTADO: (estado: string) => `${this.BASE_URL}/paz-salvo/estado/${estado}`,
    APROBAR: (id: string) => `${this.BASE_URL}/paz-salvo/${id}/aprobar`,
    RECHAZAR: (id: string) => `${this.BASE_URL}/paz-salvo/${id}/rechazar`,
    DOCUMENTOS: (id: string) => `${this.BASE_URL}/paz-salvo/${id}/documentos`,
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/paz-salvo/${id}/documentos/upload`
  };

  // ===== REINGRESO DE ESTUDIANTE =====
  static readonly REINGRESO_ESTUDIANTE = {
    BASE: `${this.BASE_URL}/reingreso-estudiante`,
    BY_ID: (id: string) => `${this.BASE_URL}/reingreso-estudiante/${id}`,
    BY_ESTUDIANTE: (estudianteId: string) => `${this.BASE_URL}/reingreso-estudiante/estudiante/${estudianteId}`,
    BY_ESTADO: (estado: string) => `${this.BASE_URL}/reingreso-estudiante/estado/${estado}`,
    APROBAR: (id: string) => `${this.BASE_URL}/reingreso-estudiante/${id}/aprobar`,
    RECHAZAR: (id: string) => `${this.BASE_URL}/reingreso-estudiante/${id}/rechazar`,
    DOCUMENTOS: (id: string) => `${this.BASE_URL}/reingreso-estudiante/${id}/documentos`,
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/reingreso-estudiante/${id}/documentos/upload`
  };

  // ===== PRUEBAS ECAES =====
  static readonly PRUEBAS_ECAES = {
    BASE: `${this.BASE_URL}/pruebas-ecaes`,
    BY_ID: (id: string) => `${this.BASE_URL}/pruebas-ecaes/${id}`,
    BY_ESTUDIANTE: (estudianteId: string) => `${this.BASE_URL}/pruebas-ecaes/estudiante/${estudianteId}`,
    BY_ESTADO: (estado: string) => `${this.BASE_URL}/pruebas-ecaes/estado/${estado}`,
    APROBAR: (id: string) => `${this.BASE_URL}/pruebas-ecaes/${id}/aprobar`,
    RECHAZAR: (id: string) => `${this.BASE_URL}/pruebas-ecaes/${id}/rechazar`,
    DOCUMENTOS: (id: string) => `${this.BASE_URL}/pruebas-ecaes/${id}/documentos`,
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/pruebas-ecaes/${id}/documentos/upload`
  };

  // ===== MÓDULO ESTADÍSTICO =====
  static readonly MODULO_ESTADISTICO = {
    BASE: `${this.BASE_URL}/modulo-estadistico`,
    DASHBOARD: `${this.BASE_URL}/modulo-estadistico/dashboard`,
    REPORTES: `${this.BASE_URL}/modulo-estadistico/reportes`,
    ESTADISTICAS: `${this.BASE_URL}/modulo-estadistico/estadisticas`,
    EXPORTAR: (formato: string) => `${this.BASE_URL}/modulo-estadistico/exportar/${formato}`
  };

  // ===== DOCUMENTOS =====
  static readonly DOCUMENTOS = {
    BASE: `${this.BASE_URL}/documentos`,
    BY_ID: (id: string) => `${this.BASE_URL}/documentos/${id}`,
    DOWNLOAD: (id: string) => `${this.BASE_URL}/documentos/${id}/download`,
    DELETE: (id: string) => `${this.BASE_URL}/documentos/${id}`,
    UPLOAD: `${this.BASE_URL}/documentos/upload`
  };

  // ===== ROLES =====
  static readonly ROLES = {
    BASE: `${this.BASE_URL}/roles`,
    BY_ID: (id: string) => `${this.BASE_URL}/roles/${id}`,
    BY_NAME: (name: string) => `${this.BASE_URL}/roles/name/${name}`,
    PERMISOS: (id: string) => `${this.BASE_URL}/roles/${id}/permisos`,
    UPDATE: (id: string) => `${this.BASE_URL}/roles/${id}`,
    DELETE: (id: string) => `${this.BASE_URL}/roles/${id}`
  };
}
