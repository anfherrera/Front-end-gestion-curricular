import { environment } from '@env/environment';

export class ApiEndpoints {
  static readonly BASE_URL = environment.apiUrl;

  // ===== AUTENTICACIÓN =====
  static readonly AUTH = {
    LOGIN: `${this.BASE_URL}/usuarios/login`,
  };

  // ===== PERÍODOS ACADÉMICOS =====
  // Rutas de la convención del backend (EST-7): GET /, GET /?desde=AAAA, GET /actual y GET /{periodo}.
  static readonly PERIODOS_ACADEMICOS = {
    TODOS: `${this.BASE_URL}/periodos-academicos`,
    /** Últimos 5 años, sin bajar de 2020 (antes /recientes). */
    get RECIENTES(): string {
      return `${environment.apiUrl}/periodos-academicos?desde=${Math.max(2020, new Date().getFullYear() - 4)}`;
    },
    ACTUAL: `${this.BASE_URL}/periodos-academicos/actual`,
  };

  // ===== CURSOS INTERSEMESTRALES =====
  static readonly CURSOS_INTERSEMESTRALES = {
    // ===== CURSOS DE VERANO =====
    CURSOS_VERANO: {
      // Cursos (EST-7, paso 8a): GET sin filtros (staff), ?disponibles=true (estudiantes),
      // ?estado=preinscripcion|inscripcion y ?formato=pdf; POST; GET, PUT y DELETE /{id}
      CURSOS: `${this.BASE_URL}/cursos-verano/cursos`,
      // Períodos con cursos visibles para los estudiantes, del más reciente al más antiguo (BUG-51)
      PERIODOS: `${this.BASE_URL}/cursos-verano/cursos/periodos`,
      ESTUDIANTES_CURSO: (idCurso: number) => `${this.BASE_URL}/cursos-verano/cursos/${idCurso}/estudiantes`,

      ESTUDIANTES_ELEGIBLES: (idCurso: number) =>
        `${this.BASE_URL}/cursos-verano/cursos/${idCurso}/estudiantes-elegibles`,

      // Preinscripciones e inscripciones (EST-7, paso 8b): POST; GET ?usuario= o ?curso=;
      // PUT /{id}/estado con nuevoEstado y, en preinscripciones, PUT /{id}/observaciones
      PREINSCRIPCIONES: `${this.BASE_URL}/cursos-verano/preinscripciones`,
      INSCRIPCIONES: `${this.BASE_URL}/cursos-verano/inscripciones`,
      SOLICITUDES_CURSO_NUEVO: `${this.BASE_URL}/cursos-verano/solicitudes-curso-nuevo`,

      // Catálogos (EST-7, paso 8c): materias, materias-disponibles, materias-filtro, docentes, salones y condiciones
      CATALOGOS: `${this.BASE_URL}/cursos-verano/catalogos`,
      CURSOS_DISPONIBLES: `${this.BASE_URL}/cursos-verano/catalogos/materias-disponibles`,
      CONDICIONES: `${this.BASE_URL}/cursos-verano/catalogos/condiciones`,
      SALONES: `${this.BASE_URL}/cursos-verano/catalogos/salones`,

      // Reportes (EST-7, paso 8c): solicitudes (?formato=excel), dashboard y seguimiento (?usuario=)
      REPORTES_SOLICITUDES: `${this.BASE_URL}/cursos-verano/reportes/solicitudes`,
      DASHBOARD_ESTADISTICAS: `${this.BASE_URL}/cursos-verano/reportes/dashboard`,
      SEGUIMIENTO: `${this.BASE_URL}/cursos-verano/reportes/seguimiento`,
    },
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
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/homologacion-asignaturas/${id}/documentos/upload`,
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
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/paz-salvo/${id}/documentos/upload`,
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
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/reingreso-estudiante/${id}/documentos/upload`,
  };

  // ===== SOLICITUDES (GENERAL) =====
  static readonly SOLICITUDES = {
    BASE: `${this.BASE_URL}/solicitudes`,
    HISTORIAL: `${this.BASE_URL}/solicitudes/historial`, // Historial completo de todas las solicitudes
    BY_ID: (id: number) => `${this.BASE_URL}/solicitudes/${id}`, // Una solicitud con sus estados y documentos
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
    UPLOAD_DOCUMENT: (id: string) => `${this.BASE_URL}/pruebas-ecaes/${id}/documentos/upload`,
  };

  // ===== MÓDULO ESTADÍSTICO =====
  static readonly MODULO_ESTADISTICO = {
    RESUMEN_COMPLETO: `${this.BASE_URL}/estadisticas/resumen-completo`,

    // ===== ENDPOINTS DE ESTUDIANTES =====
    TOTAL_ESTUDIANTES: `${this.BASE_URL}/estadisticas/total-estudiantes`,
    ESTUDIANTES_POR_PROGRAMA: `${this.BASE_URL}/estadisticas/estudiantes-por-programa`,
    ESTADISTICAS_POR_PROCESO: `${this.BASE_URL}/estadisticas/estadisticas-por-proceso`,
    ESTADO_SOLICITUDES: `${this.BASE_URL}/estadisticas/estado-solicitudes`,

    // ===== ENDPOINTS MEJORADOS =====
    ESTADISTICAS_POR_PROGRAMA_MEJORADAS: `${this.BASE_URL}/estadisticas/por-programa`,
    ESTADISTICAS_POR_PERIODO_MEJORADAS: `${this.BASE_URL}/estadisticas/por-periodo`,

    // ===== Endpoint - tendencias y comparativas =====
    TENDENCIAS_COMPARATIVAS: `${this.BASE_URL}/estadisticas/tendencias-comparativas`,

    // ===== Endpoint - cursos de verano =====
    CURSOS_VERANO: `${this.BASE_URL}/estadisticas/cursos-verano`,

    // ===== ENDPOINTS OPTIMIZADOS - CURSOS DE VERANO =====
    CURSOS_VERANO_TENDENCIAS_TEMPORALES: `${this.BASE_URL}/estadisticas/cursos-verano/tendencias-temporales`,

    // ===== Reportes (EST-7, paso 9): ?formato=pdf|excel =====
    REPORTES: `${this.BASE_URL}/estadisticas/reportes`,
    CURSOS_VERANO_REPORTES: `${this.BASE_URL}/estadisticas/cursos-verano/reportes`,
  };

  // ===== DOCUMENTOS =====
  static readonly DOCUMENTOS = {
    BASE: `${this.BASE_URL}/documentos`,
    BY_ID: (id: string) => `${this.BASE_URL}/documentos/${id}`,
    DOWNLOAD: (id: string) => `${this.BASE_URL}/documentos/${id}/download`,
    DELETE: (id: string) => `${this.BASE_URL}/documentos/${id}`,
    UPLOAD: `${this.BASE_URL}/documentos/upload`,
  };

  // ===== ARCHIVOS =====
  static readonly ARCHIVOS = {
    BASE: `${this.BASE_URL}/archivos`,
    SUBIR_PDF: `${this.BASE_URL}/archivos`,
    DESCARGAR_PDF: (filename: string) =>
      `${this.BASE_URL}/archivos?nombre=${encodeURIComponent(filename)}`,
    DESCARGAR_PDF_POR_INSCRIPCION: (inscripcionId: number) =>
      `${this.BASE_URL}/archivos/inscripciones/${inscripcionId}`,
  };

  // ===== ROLES =====
  static readonly ROLES = {
    BASE: `${this.BASE_URL}/roles`,
    BY_ID: (id: string) => `${this.BASE_URL}/roles/${id}`,
    BY_NAME: (name: string) => `${this.BASE_URL}/roles/name/${name}`,
    PERMISOS: (id: string) => `${this.BASE_URL}/roles/${id}/permisos`,
    UPDATE: (id: string) => `${this.BASE_URL}/roles/${id}`,
    DELETE: (id: string) => `${this.BASE_URL}/roles/${id}`,
  };
}
