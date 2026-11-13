import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { descargarBlob, nombreDeContentDisposition } from '@core/utils/download.util';

import { Archivo, SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { RequestStatusTableComponent } from "@shared/components/request-status/request-status.component";
import { FileUploadComponent } from "@shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "@shared/components/required-docs/required-docs.component";
import { VerComentariosDialogComponent, VerComentariosDialogData } from "@shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component";

import { HomologacionAsignaturasService } from '@core/services/homologacion-asignaturas.service';
import { FormatosInstitucionalesService } from '@core/services/formatos-institucionales.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { Subject, takeUntil } from 'rxjs';

import { Solicitud } from '@core/models/procesos.model';
import { normalizarNombreArchivo, coincidenPorPalabrasClave } from '@core/utils/texto.util';
import { getPeriodoActual } from '@core/utils/periodo.utils';
import { SnackbarService } from '@core/services/snackbar.service';

/** Palabras que identifican cada documento requerido, para reconocer archivos con otro nombre. */
const PALABRAS_CLAVE_DOCUMENTOS: Record<string, string[]> = {
  'pmfo4for22': ['pmfo4for22', 'pm-fo-4-for-22', 'solicitud', 'homologacion', 'homologación'],
  'certificado': ['certificado', 'notas', 'calificaciones', 'notas academicas'],
  'programa': ['programa', 'academico', 'materia', 'asignatura', 'syllabus']
};

@Component({
  selector: 'app-solicitud-homologacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['../solicitud-estudiante-comun.css', './homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit, OnDestroy {
  private homologacionService = inject(HomologacionAsignaturasService);
  private formatosService = inject(FormatosInstitucionalesService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private notificacionesService = inject(NotificacionesService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private errorHandler = inject(ErrorHandlerService);
  private periodosService = inject(PeriodosAcademicosService);
  private fb = inject(FormBuilder);

  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  private destroy$ = new Subject<void>();

  documentosRequeridos = [
    { label: 'PM-FO-4-FOR-22 Solicitud homologación de materias', obligatorio: true, formatoDisponibleUrl: '' as string },
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

  constructor() {
    // Inicializar formulario con los campos de información de la solicitud
    this.solicitudForm = this.fb.group({
      programa_origen: ['', [Validators.maxLength(200)]],
      programa_destino: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    const homologacion = this.formatosService.getHomologacion();
    if (homologacion) {
      this.documentosRequeridos[0].label = homologacion.nombre;
      this.documentosRequeridos[0].formatoDisponibleUrl = homologacion.url;
    }

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
    const nombreNormalizado = normalizarNombreArchivo(nombreDocumento);
    return this.archivosActuales.some(archivo => {
      const nombreArchivo = normalizarNombreArchivo(archivo.nombre);
      // Buscar coincidencias parciales (por si el nombre del archivo es ligeramente diferente)
      return nombreArchivo.includes(nombreNormalizado) ||
             nombreNormalizado.includes(nombreArchivo) ||
             coincidenPorPalabrasClave(nombreArchivo, nombreNormalizado, PALABRAS_CLAVE_DOCUMENTOS);
    });
  }

  onSolicitudEnviada() {
    if (!this.usuario) {
      this.logger.error('No se puede enviar solicitud: usuario no encontrado.');
      this.snackbar.error('Error: Usuario no encontrado. Por favor, inicia sesión nuevamente.');
      return;
    }

    if (!this.fileUploadComponent) {
      this.logger.error('No se puede acceder al componente de archivos.');
      this.snackbar.error('Error: No se puede acceder al componente de archivos.');
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
        const periodoAcademico = periodoActual?.valor || getPeriodoActual();

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

      this.notificacionesService.actualizarNotificaciones();

      // Resetear el file upload
      this.resetFileUpload = true;
      setTimeout(() => this.resetFileUpload = false, 0);

            this.snackbar.exito('¡Solicitud de homologación enviada correctamente!');
    },
    error: (err) => {
      this.logger.error('Error al crear solicitud', err);
      const mensajeError = this.errorHandler.extraerMensajeError(err);
      if (err.status === 400) {
        this.snackbar.advertencia(mensajeError || 'Error de validación: revisa los datos de la solicitud');
      } else if (err.status === 401) {
        this.snackbar.advertencia('Sesión expirada. Por favor, inicia sesión de nuevo.');
      } else {
        this.snackbar.error(mensajeError || 'Error al crear la solicitud. Por favor, inténtalo de nuevo.');
      }
    }
  });
      },
      error: (err) => {
        this.logger.error('Error al subir archivos', err);
        const mensajeError = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensajeError || 'Error al subir archivos. Por favor, inténtalo de nuevo.');

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
          fecha: sol.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
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
      this.snackbar.error(mensajeError || 'Error al cargar las solicitudes. Por favor, inténtalo de nuevo.');
    }
  });
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
    this.snackbar.error('No se encontró la información de la solicitud');
    return;
  }

  if (!solicitudCompleta.documentos || solicitudCompleta.documentos.length === 0) {
    this.snackbar.advertencia('No hay documentos asociados a esta solicitud');
    return;
  }

  // Obtener el comentario de rechazo del último estado
  const comentarioRechazo = this.obtenerComentarioRechazo(solicitudCompleta);

  this.logger.debug('Datos que se envían al diálogo', {
    titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
    documentos: solicitudCompleta.documentos,
    comentarioRechazo: comentarioRechazo
  });

  const dialogRef = this.dialog.open(VerComentariosDialogComponent, {
    width: '700px',
    data: {
      titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
      documentos: solicitudCompleta.documentos,
      comentarioRechazo: comentarioRechazo
    } as VerComentariosDialogData
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
        this.snackbar.advertencia('No hay oficios disponibles para esta solicitud');
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

  this.homologacionService.descargarOficioConNombre(idSolicitud || 1)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
    next: (response) => {
      // Sin Content-Disposition se usa el nombre que vino de obtenerOficios
      const nombre = nombreDeContentDisposition(response.headers) || nombreArchivo;
      if (response.body) descargarBlob(response.body, nombre);
      this.snackbar.exito('Oficio descargado exitosamente');
    },
    error: (err) => {
      this.logger.error('Error al descargar archivo', err);
      const mensajeError = this.errorHandler.extraerMensajeError(err);
      this.snackbar.error(mensajeError || 'Error al descargar archivo. Por favor, inténtalo de nuevo.');
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
    this.snackbar.advertencia('No se encontró el archivo con los nombres probados');
    return;
  }

  const nombre = nombres[index];
  this.logger.debug(`Probando nombre ${index + 1}/${nombres.length}`, { nombre, index, total: nombres.length });

  this.descargarArchivoPorNombre(nombre, nombreDescarga, idSolicitud);
}


/**
 * Mostrar oficios en la UI
 */
private mostrarOficiosEnUI(oficios: any[]): void {
  this.logger.debug('Mostrando oficios en UI', oficios);

  if (!oficios || oficios.length === 0) {
    this.snackbar.info('No hay oficios disponibles');
    return;
  }

  this.snackbar.exito(`Se encontraron ${oficios.length} oficio(s) disponible(s)`);
}

}
