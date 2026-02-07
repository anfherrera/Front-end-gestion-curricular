import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "../../../shared/components/required-docs/required-docs.component";
import { ComentariosDialogComponent, ComentariosDialogData } from "../../../shared/components/comentarios-dialog/comentarios-dialog.component";

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { MatDialog } from '@angular/material/dialog';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';
import { Subject, takeUntil } from 'rxjs';

import { Solicitud } from '../../../core/models/procesos.model';

@Component({
  selector: 'app-solicitud-homologacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit, OnDestroy {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  private destroy$ = new Subject<void>();

  documentosRequeridos = [
    { label: 'PM-FO-4-FOR-22 Solicitud homologación de materias', obligatorio: true },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Programa académico de la materia', obligatorio: true }
  ];

  archivosExclusivos: string[] = [];

  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudHomologacionDTORespuesta[] = [];

  usuario: any = null;
  solicitudForm: FormGroup;

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private notificacionesService: NotificacionesService,
    private authService: AuthService,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService,
    private periodosService: PeriodosAcademicosService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con los campos de información de la solicitud
    this.solicitudForm = this.fb.group({
      programa_origen: ['', [Validators.maxLength(200)]],
      programa_destino: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      this.logger.debug('Usuario cargado desde localStorage', this.usuario);
    } else {
      this.logger.warn('No se encontró usuario en localStorage');
    }

    // Listar solicitudes existentes al cargar el componente
    this.listarSolicitudes();

    // Verificar funcionalidad de comentarios (para debugging)
    setTimeout(() => {
      this.verificarFuncionalidadComentarios();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
  }

  puedeEnviar(): boolean {
    return this.archivosActuales.length > 0 && !!this.usuario;
  }

  /**
   * Obtener lista de documentos faltantes (solo informativo, no bloquea envío)
   * @returns Array con nombres de documentos que no se han subido
   */
  obtenerDocumentosFaltantes(): string[] {
    const faltantes: string[] = [];

    // Obtener documentos obligatorios
    const documentosObligatorios = this.documentosRequeridos.filter(doc => doc.obligatorio);

    // Verificar cada documento obligatorio
    documentosObligatorios.forEach(doc => {
      if (!this.archivoSubido(doc.label)) {
        faltantes.push(doc.label);
      }
    });

    return faltantes;
  }

  /**
   * Verificar si un archivo ha sido subido basándose en el nombre del documento
   * @param nombreDocumento Nombre del documento requerido
   * @returns true si el archivo fue subido, false en caso contrario
   */
  private archivoSubido(nombreDocumento: string): boolean {
    const nombreNormalizado = this.normalizarNombre(nombreDocumento);
    return this.archivosActuales.some(archivo => {
      const nombreArchivo = this.normalizarNombre(archivo.nombre);
      // Buscar coincidencias parciales (por si el nombre del archivo es ligeramente diferente)
      return nombreArchivo.includes(nombreNormalizado) ||
             nombreNormalizado.includes(nombreArchivo) ||
             this.coincidenciaFuzzy(nombreArchivo, nombreNormalizado);
    });
  }

  /**
   * Normalizar nombre de archivo para comparación
   * @param nombre Nombre a normalizar
   * @returns Nombre normalizado (sin acentos, minúsculas, sin espacios ni caracteres especiales)
   */
  private normalizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/\.[^/.]+$/, '') // Eliminar extensión
      .replace(/[^a-z0-9]/g, ''); // Eliminar caracteres especiales y espacios
  }

  /**
   * Verificar coincidencia aproximada entre nombres (fuzzy matching)
   * Útil para detectar archivos con nombres ligeramente diferentes
   * @param nombre1 Primer nombre
   * @param nombre2 Segundo nombre
   * @returns true si hay coincidencia aproximada
   */
  private coincidenciaFuzzy(nombre1: string, nombre2: string): boolean {
    // Palabras clave comunes para cada tipo de documento
    const palabrasClave: { [key: string]: string[] } = {
      'pmfo4for22': ['pmfo4for22', 'pm-fo-4-for-22', 'solicitud', 'homologacion', 'homologación'],
      'certificado': ['certificado', 'notas', 'calificaciones', 'notas academicas'],
      'programa': ['programa', 'academico', 'materia', 'asignatura', 'syllabus']
    };

    // Buscar palabras clave en ambos nombres
    for (const [clave, palabras] of Object.entries(palabrasClave)) {
      if (nombre1.includes(clave) || nombre2.includes(clave)) {
        return palabras.some(palabra =>
          nombre1.includes(palabra) && nombre2.includes(palabra)
        );
      }
    }

    return false;
  }

  /**
   * Muestra un mensaje bonito usando SnackBar
   */
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const config = {
      duration: tipo === 'success' ? 4000 : 6000,
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${tipo}`]
    };

    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  onSolicitudEnviada() {
    if (!this.usuario) {
      this.logger.error('No se puede enviar solicitud: usuario no encontrado.');
      this.snackBar.open('Error: Usuario no encontrado. Por favor, inicia sesión nuevamente.', 'Cerrar', snackbarConfig(['error-snackbar']));
      return;
    }

    if (!this.fileUploadComponent) {
      this.logger.error('No se puede acceder al componente de archivos.');
      this.snackBar.open('Error: No se puede acceder al componente de archivos.', 'Cerrar', snackbarConfig(['error-snackbar']));
      return;
    }

    this.logger.debug('Iniciando proceso de envío de solicitud');

    // Paso 1: Subir archivos al backend
    this.fileUploadComponent.subirArchivosPendientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (archivosSubidos) => {
        this.logger.debug('Archivos subidos correctamente', archivosSubidos);

        // Paso 2: Crear la solicitud con los archivos ya subidos
        // Obtener nombre completo del usuario
        const nombreCompleto = this.usuario?.nombre_completo ||
                               this.usuario?.nombre ||
                               'Usuario';
        const nombreFinal = nombreCompleto.trim() !== '' ? nombreCompleto.trim() : 'Usuario';

        // Obtener período académico actual
        const periodoActual = this.periodosService.getPeriodoActualValue();
        const periodoAcademico = periodoActual?.valor || this.obtenerPeriodoActualFallback();

        // Obtener valores del formulario (pueden ser null o string vacío)
        const programaOrigen = this.solicitudForm.get('programa_origen')?.value?.trim() || null;
        const programaDestino = this.solicitudForm.get('programa_destino')?.value?.trim() || null;

        const solicitud = {
          nombre_solicitud: `Solicitud Homologación - ${nombreFinal}`,
          fecha_registro_solicitud: new Date().toISOString(),
          periodo_academico: periodoAcademico, // Obligatorio
          fecha_ceremonia: null, // Opcional, se puede agregar un campo en el formulario si es necesario
          objUsuario: {
            id_usuario: this.usuario.id_usuario,
            nombre_completo: this.usuario.nombre_completo,
            codigo: this.usuario.codigo,
            cedula: this.usuario.cedula || this.usuario.codigo, // Usar cedula si existe, sino codigo
            correo: this.usuario.correo || this.usuario.email_usuario,
            // FIX: Agregar id_rol e id_programa como campos requeridos por el backend
            id_rol: this.usuario.id_rol || this.usuario.objRol?.id_rol || 1, // 1 = ESTUDIANTE por defecto
            id_programa: this.usuario.id_programa || this.usuario.objPrograma?.id_programa || 1,
            objPrograma: this.usuario.objPrograma || {
              id_programa: this.usuario.id_programa || this.usuario.objPrograma?.id_programa || 1,
              nombre_programa: this.usuario.objPrograma?.nombre_programa || "Ingeniería de Sistemas"
            }
          },
          archivos: archivosSubidos,
          programa_origen: programaOrigen,
          programa_destino: programaDestino
        };

        this.logger.debug('Creando solicitud con archivos', solicitud);

  this.homologacionService.crearSolicitud(solicitud)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
    next: (resp) => {
      this.logger.debug('Solicitud creada en backend', resp);
      this.listarSolicitudes();

      // Actualizar notificaciones después de crear la solicitud
      const usuario = this.authService.getUsuario();
      if (usuario?.id_usuario) {
        this.notificacionesService.actualizarNotificaciones(usuario.id_usuario);
      }

      // Resetear el file upload
      this.resetFileUpload = true;
      setTimeout(() => this.resetFileUpload = false, 0);

            this.mostrarMensaje('¡Solicitud de homologación enviada correctamente!', 'success');
    },
    error: (err) => {
      this.logger.error('Error al crear solicitud', err);
      const mensajeError = this.errorHandler.extraerMensajeError(err);
      if (err.status === 400) {
        this.mostrarMensaje(mensajeError || 'Error de validación: revisa los datos de la solicitud', 'warning');
      } else if (err.status === 401) {
        this.mostrarMensaje('Sesión expirada. Por favor, inicia sesión de nuevo.', 'warning');
      } else {
        this.mostrarMensaje(mensajeError || 'Error al crear la solicitud. Por favor, inténtalo de nuevo.', 'error');
      }
    }
  });
      },
      error: (err) => {
        this.logger.error('Error al subir archivos', err);
        const mensajeError = this.errorHandler.extraerMensajeError(err);
        this.mostrarMensaje(mensajeError || 'Error al subir archivos. Por favor, inténtalo de nuevo.', 'error');

        // Resetear el estado de carga del componente de subida
        if (this.fileUploadComponent) {
          this.fileUploadComponent.resetearEstadoCarga();
        }
    }
  });
}




listarSolicitudes() {
  if (!this.usuario) {
    this.logger.error("Usuario no encontrado en localStorage.");
    return;
  }

  this.logger.debug('Usuario encontrado', {
    rol: this.usuario.rol?.nombre,
    idUsuario: this.usuario.id_usuario
  });

  this.homologacionService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
    next: (data) => {
      this.logger.debug('Respuesta del backend', {
        tipo: typeof data,
        esArray: Array.isArray(data),
        longitud: data?.length
      });

      if (!data || !Array.isArray(data)) {
        this.logger.warn('La respuesta no es un array válido', data);
        this.solicitudes = [];
        this.solicitudesCompletas = [];
        return;
      }

      // Guardar las solicitudes completas para usar comentarios
      this.solicitudesCompletas = data;

      this.logger.debug('Estructura de datos del backend', {
        totalSolicitudes: data.length,
        primeraSolicitud: data.length > 0 ? data[0] : null
      });

      this.solicitudes = data.map((sol: any) => {
        this.logger.debug('Procesando solicitud', sol);

        const estados = sol.estado_actual || sol.estadosSolicitud || [];
        const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

        const rutaArchivo = sol.documentos?.length > 0 ? sol.documentos[0].ruta : '';

        const solicitudTransformada = {
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: ultimoEstado?.estado_actual || 'Pendiente',
          rutaArchivo,
          comentarios: ultimoEstado?.comentarios || ''
        };

        this.logger.debug('Solicitud transformada', solicitudTransformada);
        return solicitudTransformada;
      });

      this.logger.debug('Solicitudes cargadas', {
        transformadas: this.solicitudes.length,
        completas: this.solicitudesCompletas.length
      });
    },
    error: (err) => {
      this.logger.error('Error al listar solicitudes', {
        status: err.status,
        message: err.message,
        error: err
      });
      const mensajeError = this.errorHandler.extraerMensajeError(err);
      this.snackBar.open(
        mensajeError || 'Error al cargar las solicitudes. Por favor, inténtalo de nuevo.',
        'Cerrar',
        snackbarConfig(['error-snackbar'])
      );
    }
  });
}

  /**
   * Obtener período académico actual como fallback
   */
  private obtenerPeriodoActualFallback(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1; // 0-11 -> 1-12
    const semestre = mes <= 6 ? 1 : 2;
    return `${año}-${semestre}`;
  }

  /**
   * Verificar si una solicitud está rechazada
   */
  esSolicitudRechazada(estado: string): boolean {
    return estado === 'RECHAZADA' || estado === 'Rechazada';
  }

/**
 * Obtener la solicitud completa por ID
 */
obtenerSolicitudCompleta(idSolicitud: number): SolicitudHomologacionDTORespuesta | undefined {
  return this.solicitudesCompletas.find(sol => sol.id_solicitud === idSolicitud);
}

/**
 * Obtener el comentario de rechazo del último estado
 */
obtenerComentarioRechazo(solicitud: SolicitudHomologacionDTORespuesta): string | null {
  this.logger.debug('Obteniendo comentario de rechazo para solicitud', {
    idSolicitud: solicitud.id_solicitud,
    estados: solicitud.estadosSolicitud
  });

  if (!solicitud.estadosSolicitud || solicitud.estadosSolicitud.length === 0) {
    this.logger.warn('No hay estados en la solicitud', solicitud.id_solicitud);
    return null;
  }

  // Buscar el último estado que sea RECHAZADA
  const estadosRechazados = solicitud.estadosSolicitud.filter(estado =>
    estado.estado_actual === 'RECHAZADA' || estado.estado_actual === 'Rechazada'
  );

  this.logger.debug('Estados rechazados encontrados', estadosRechazados);

  if (estadosRechazados.length === 0) {
    this.logger.debug('No se encontraron estados de rechazo');
    return null;
  }

  // Obtener el último estado de rechazo
  const ultimoEstadoRechazo = estadosRechazados[estadosRechazados.length - 1];

  this.logger.debug('Último estado de rechazo encontrado', {
    estado: ultimoEstadoRechazo,
    comentario: ultimoEstadoRechazo.comentario
  });

  return ultimoEstadoRechazo.comentario || null;
}

/**
 * Ver comentarios de una solicitud rechazada
 */
verComentarios(solicitudId: number): void {
  const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);

  if (!solicitudCompleta) {
    this.mostrarMensaje('No se encontró la información de la solicitud', 'error');
    return;
  }

  if (!solicitudCompleta.documentos || solicitudCompleta.documentos.length === 0) {
    this.mostrarMensaje('No hay documentos asociados a esta solicitud', 'warning');
    return;
  }

  // Obtener el comentario de rechazo del último estado
  const comentarioRechazo = this.obtenerComentarioRechazo(solicitudCompleta);

  this.logger.debug('Datos que se envían al diálogo', {
    titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
    documentos: solicitudCompleta.documentos,
    comentarioRechazo: comentarioRechazo
  });

  const dialogRef = this.dialog.open(ComentariosDialogComponent, {
    width: '700px',
    data: <ComentariosDialogData>{
      titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
      documentos: solicitudCompleta.documentos,
      comentarioRechazo: comentarioRechazo
    }
  });

  dialogRef.afterClosed()
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
    this.logger.debug('Diálogo de comentarios cerrado');
  });
}

/**
 * Verificar si una solicitud tiene comentarios
 */
tieneComentarios(solicitudId: number): boolean {
  const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);

  if (!solicitudCompleta || !solicitudCompleta.documentos) {
    return false;
  }

  return solicitudCompleta.documentos.some(doc =>
    doc.comentario && doc.comentario.trim().length > 0
  );
}

/**
 * Método de prueba para verificar el funcionamiento
 */
verificarFuncionalidadComentarios(): void {
  this.logger.debug('Verificando funcionalidad de comentarios', {
    solicitudesCompletas: this.solicitudesCompletas.length,
    solicitudesTransformadas: this.solicitudes.length
  });

  // Buscar solicitudes rechazadas
  const solicitudesRechazadas = this.solicitudes.filter(sol =>
    this.esSolicitudRechazada(sol.estado)
  );

  this.logger.debug('Solicitudes rechazadas encontradas', solicitudesRechazadas);

  solicitudesRechazadas.forEach(sol => {
    const tieneComentarios = this.tieneComentarios(sol.id);
    this.logger.debug(`Solicitud ${sol.id}`, {
      nombre: sol.nombre,
      tieneComentarios: tieneComentarios
    });
  });
}


/**
 * Descargar oficio
 */
descargarOficio(idOficio: number, nombreArchivo: string): void {
  this.logger.debug('Descargando oficio', { idOficio, nombreArchivo });

  // Primero intentar obtener los oficios disponibles para esta solicitud
  this.obtenerOficiosYDescargar(idOficio, nombreArchivo);
}

/**
 * Obtener oficios y descargar
 */
private obtenerOficiosYDescargar(idSolicitud: number, nombreArchivo: string): void {
  this.homologacionService.obtenerOficios(idSolicitud)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
    next: (oficios) => {
      this.logger.debug('Oficios obtenidos', oficios);

      if (!oficios || oficios.length === 0) {
        this.mostrarMensaje('No hay oficios disponibles para esta solicitud', 'warning');
        return;
      }

      // Tomar el primer oficio disponible
      const oficio = oficios[0];
      const nombreArchivoOficio = oficio.nombre || oficio.nombreArchivo || `oficio_${idSolicitud}.pdf`;

      // Intentar descargar usando el endpoint de archivos
      this.descargarArchivoPorNombre(nombreArchivoOficio, nombreArchivo, idSolicitud);
    },
    error: (err) => {
      this.logger.error('Error al obtener oficios', err);

      // Si no se pueden obtener oficios, intentar con nombres comunes
      this.intentarDescargaConNombresComunes(idSolicitud, nombreArchivo);
    }
  });
}

/**
 * Descargar archivo por nombre usando el endpoint de archivos
 */
private descargarArchivoPorNombre(nombreArchivo: string, nombreDescarga: string, idSolicitud?: number): void {
  this.logger.debug('Descargando archivo por nombre', { nombreArchivo, nombreDescarga, idSolicitud });

  // Usar el endpoint de solicitudes de homologación que acabamos de crear
  const url = `${environment.apiUrl}/solicitudes-homologacion/descargarOficio/${idSolicitud || 1}`;

  // Crear headers con autorización
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  this.http.get(url, {
    headers: headers,
    responseType: 'blob',
    observe: 'response'
  })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
    next: (response) => {
      this.logger.debug('Archivo descargado exitosamente');

      // Obtener el nombre del archivo desde los headers de la respuesta
      const contentDisposition = response.headers.get('Content-Disposition');
      let nombreArchivoDescarga = nombreDescarga || nombreArchivo;

      this.logger.debug('Content-Disposition header', contentDisposition);

      if (contentDisposition) {
        // Intentar diferentes patrones para extraer el nombre del archivo
        let matches = contentDisposition.match(/filename="(.+)"/);
        if (!matches) {
          matches = contentDisposition.match(/filename=([^;]+)/);
        }
        if (!matches) {
          matches = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        }

        if (matches && matches[1]) {
          nombreArchivoDescarga = decodeURIComponent(matches[1]);
          this.logger.debug('Nombre del archivo desde headers', nombreArchivoDescarga);
        } else {
          this.logger.warn('No se pudo extraer el nombre del archivo del header Content-Disposition');
        }
      } else {
        this.logger.warn('No se encontró el header Content-Disposition');
        // Usar el nombre del archivo que viene del método obtenerOficios
        nombreArchivoDescarga = nombreArchivo;
        this.logger.debug('Usando nombre del archivo del método obtenerOficios', nombreArchivoDescarga);
      }

      // Crear URL temporal y descargar
      const blob = response.body!;

      // Logging para diagnosticar el problema
      this.logger.debug('Información del archivo descargado', {
        contentType: response.headers.get('Content-Type'),
        blobSize: blob.size,
        blobType: blob.type,
        nombreDescarga: nombreArchivoDescarga
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivoDescarga;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.mostrarMensaje('Oficio descargado exitosamente', 'success');
    },
    error: (err) => {
      this.logger.error('Error al descargar archivo', err);
      const mensajeError = this.errorHandler.extraerMensajeError(err);
      this.mostrarMensaje(mensajeError || 'Error al descargar archivo. Por favor, inténtalo de nuevo.', 'error');
    }
  });
}

/**
 * Intentar descarga con nombres comunes
 */
private intentarDescargaConNombresComunes(idSolicitud: number, nombreArchivo: string): void {
  this.logger.debug('Intentando descarga con nombres comunes', { idSolicitud, nombreArchivo });

  // Obtener información del usuario para generar nombres
  const usuario = this.usuario;
  const codigoUsuario = usuario?.codigo || usuario?.codigo_estudiante || 'SIN_CODIGO';
  const año = new Date().getFullYear();

  // Nombres comunes a probar
  const nombresComunes = [
    `OFICIO_HOMOLOGACION_${codigoUsuario}_${año} (1).pdf`,
    `OFICIO_HOMOLOGACION_${codigoUsuario}_${año}.pdf`,
    `oficio_homologacion_${codigoUsuario}_${año}.pdf`,
    `homologacion_${codigoUsuario}_${año}.pdf`,
    `oficio_${idSolicitud}.pdf`,
    `homologacion_${idSolicitud}.pdf`
  ];

  this.probarNombresSecuencial(nombresComunes, 0, nombreArchivo, idSolicitud);
}

/**
 * Probar nombres de archivo secuencialmente
 */
private probarNombresSecuencial(nombres: string[], index: number, nombreDescarga: string, idSolicitud: number): void {
  if (index >= nombres.length) {
    this.mostrarMensaje('No se encontró el archivo con los nombres probados', 'warning');
    return;
  }

  const nombre = nombres[index];
  this.logger.debug(`Probando nombre ${index + 1}/${nombres.length}`, { nombre, index, total: nombres.length });

  this.descargarArchivoPorNombre(nombre, nombreDescarga, idSolicitud);
}


/**
 * Obtener el estado actual de una solicitud
 */
obtenerEstadoActual(solicitud: any): string {
  if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
    const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
    return ultimoEstado.estado_actual;
  }
  return 'Pendiente';
}

/**
 * Mostrar oficios en la UI
 */
private mostrarOficiosEnUI(oficios: any[]): void {
  this.logger.debug('Mostrando oficios en UI', oficios);

  if (!oficios || oficios.length === 0) {
    this.mostrarMensaje('No hay oficios disponibles', 'info');
    return;
  }

  this.mostrarMensaje(`Se encontraron ${oficios.length} oficio(s) disponible(s)`, 'success');
}

}
