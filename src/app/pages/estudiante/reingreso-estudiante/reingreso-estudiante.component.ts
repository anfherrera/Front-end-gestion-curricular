import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { descargarBlob, nombreDeContentDisposition } from '../../../core/utils/download.util';

import { Archivo, SolicitudReingresoDTORespuesta, DocumentosDTORespuesta, SolicitudReingresoDTOPeticion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "../../../shared/components/required-docs/required-docs.component";
import { VerComentariosDialogComponent, VerComentariosDialogData } from "../../../shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component";

import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { FormatosInstitucionalesService } from '../../../core/services/formatos-institucionales.service';
import { MatDialog } from '@angular/material/dialog';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';

import { Solicitud } from '../../../core/models/procesos.model';
import { normalizarNombreArchivo, coincidenPorPalabrasClave } from '../../../core/utils/texto.util';
import { getPeriodoActual } from '../../../core/utils/periodo.utils';
import { SnackbarService } from '../../../core/services/snackbar.service';

/** Palabras que identifican cada documento requerido, para reconocer archivos con otro nombre. */
const PALABRAS_CLAVE_DOCUMENTOS: Record<string, string[]> = {
  'pmfo4for17': ['pmfo4for17', 'pm-fo-4-for-17', 'solicitud', 'reingreso', 'reingreso v2'],
  'certificado': ['certificado', 'notas', 'calificaciones', 'notas academicas'],
  'documento': ['documento', 'identidad', 'cedula', 'cédula', 'tarjeta', 'identidad'],
  'carta': ['carta', 'motivacion', 'motivación', 'motivo']
};

@Component({
  selector: 'app-reingreso-estudiante',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['./reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit, OnDestroy {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  private destroy$ = new Subject<void>();

  documentosRequeridos = [
    {
      label: 'PM-FO-4-FOR-17 Solicitud de Reingreso V2',
      obligatorio: true,
      formatoDisponibleUrl: '' as string
    },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Documento de identidad', obligatorio: true },
    { label: 'Carta de motivación', obligatorio: true }
  ];

  private readonly nombresDocumentosRequeridos = this.documentosRequeridos.map(doc => doc.label.toLowerCase().trim());

  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudReingresoDTORespuesta[] = [];

  usuario: any = null;

  constructor(
    private reingresoService: ReingresoEstudianteService,
    private formatosService: FormatosInstitucionalesService,
    private snackbar: SnackbarService,
    private dialog: MatDialog,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService,
    private periodosService: PeriodosAcademicosService
  ) {}

  ngOnInit(): void {
    const reingreso = this.formatosService.getReingreso();
    if (reingreso) {
      this.documentosRequeridos[0].label = reingreso.nombre;
      this.documentosRequeridos[0].formatoDisponibleUrl = reingreso.url;
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

        const solicitud: SolicitudReingresoDTOPeticion = {
          nombre_solicitud: `Solicitud Reingreso - ${nombreFinal}`,
          fecha_registro_solicitud: new Date(),
          periodo_academico: periodoAcademico, // Obligatorio
          fecha_ceremonia: null, // Opcional, se puede agregar un campo en el formulario si es necesario
          objUsuario: {
            id_usuario: this.usuario.id_usuario,
            nombre_completo: this.usuario.nombre_completo,
            codigo: this.usuario.codigo,
            cedula: this.usuario.cedula || this.usuario.codigo, // Usar cedula si existe, sino codigo
            correo: this.usuario.correo || this.usuario.email_usuario,
            rol: this.usuario.rol,
            estado_usuario: this.usuario.estado_usuario,
            // FIX: Agregar id_rol e id_programa como campos requeridos por el backend
            id_rol: this.usuario.id_rol || this.usuario.objRol?.id_rol || 1,
            id_programa: this.usuario.id_programa || this.usuario.objPrograma?.id_programa || 1,
            objPrograma: this.usuario.objPrograma || {
              id_programa: this.usuario.id_programa || this.usuario.objPrograma?.id_programa || 1,
              nombre_programa: this.usuario.objPrograma?.nombre_programa || "Ingeniería de Sistemas"
            }
          },
          documentos: archivosSubidos.map(archivo => ({
            nombre: archivo.nombre,
            fecha_documento: new Date(),
            esValido: true,
            comentario: archivo.comentario || undefined
          }))
        };

        this.logger.debug('Creando solicitud con archivos', solicitud);

        this.reingresoService.crearSolicitud(solicitud)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
          next: (resp) => {
            this.logger.debug('Solicitud creada en backend', resp);
            this.listarSolicitudes();

            // Resetear el file upload
            this.resetFileUpload = true;
            setTimeout(() => this.resetFileUpload = false, 0);

            this.snackbar.exito('¡Solicitud de reingreso enviada correctamente!');
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

    this.reingresoService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (data) => {
        this.logger.debug('Respuesta del backend (raw)', data);

        if (!data || !Array.isArray(data)) {
          this.logger.warn('La respuesta no es un array válido', data);
          this.solicitudes = [];
          this.solicitudesCompletas = [];
          return;
        }

        // Guardar las solicitudes completas para usar comentarios
        this.solicitudesCompletas = data;

        this.solicitudes = data.map((sol: any) => {
          // Procesando solicitud

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

        this.logger.debug('Solicitudes cargadas (transformadas)', this.solicitudes.length);
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
  obtenerSolicitudCompleta(idSolicitud: number): SolicitudReingresoDTORespuesta | undefined {
    return this.solicitudesCompletas.find(sol => sol.id_solicitud === idSolicitud);
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

    const dialogRef = this.dialog.open(VerComentariosDialogComponent, {
      width: '700px',
      data: {
        titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
        documentos: solicitudCompleta.documentos,
        comentarioRechazo: null
      } as VerComentariosDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      this.logger.debug('Diálogo de comentarios cerrado');
    });
  }

  /**
   * Método de prueba para verificar el funcionamiento
   */
  verificarFuncionalidadComentarios(): void {
    // Verificando funcionalidad de comentarios
  }

  /**
   * Descargar oficio
   */
  descargarOficio(idOficio: number, nombreArchivo: string): void {
    this.logger.debug('Descargando oficio', { idOficio, nombreArchivo });

    const documentoResolucion = this.encontrarDocumentoResolucion(idOficio);

    if (documentoResolucion) {
      this.descargarDocumentoResolucion(documentoResolucion, idOficio);
      return;
    }

    // Primero intentar obtener los oficios disponibles para esta solicitud
    this.obtenerOficiosYDescargar(idOficio, nombreArchivo);
  }

  /**
   * Obtener oficios y descargar
   */
  private obtenerOficiosYDescargar(idSolicitud: number, nombreArchivo: string): void {
    this.reingresoService.obtenerOficios(idSolicitud)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (oficios) => {
        this.logger.debug('Oficios obtenidos', oficios);

        if (!oficios || oficios.length === 0) {
          this.snackbar.advertencia('No hay oficios disponibles para esta solicitud');
          return;
        }

        const oficioSeleccionado = this.seleccionarOficioReciente(oficios, idSolicitud);
        const candidatos = this.construirCandidatosDescarga(oficioSeleccionado, idSolicitud);

        if (candidatos.length === 0) {
          this.logger.warn('No se encontraron nombres válidos para el oficio, se usará el flujo antiguo.');
          this.descargarArchivoPorNombre(nombreArchivo, nombreArchivo, idSolicitud);
          return;
        }

        const nombrePreferido = oficioSeleccionado?.nombre || oficioSeleccionado?.nombreArchivo || nombreArchivo || candidatos[0];
        const idOficio = this.obtenerIdOficio(oficioSeleccionado);

        if (idOficio) {
          this.descargarOficioPorId(idOficio, nombrePreferido, () => {
            this.descargarOficioPorCandidatos(candidatos, nombrePreferido, idSolicitud);
          });
        } else {
          this.descargarOficioPorCandidatos(candidatos, nombrePreferido, idSolicitud);
        }
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

    this.reingresoService.descargarOficioConNombre(idSolicitud || 1)
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

  private seleccionarOficioReciente(oficios: any[], idSolicitud: number): any {
    if (!oficios || oficios.length === 0) {
      return null;
    }

    const ordenados = [...oficios].sort((a, b) => {
      const fechaA = this.parsearFechaDocumento(a?.fecha_documento);
      const fechaB = this.parsearFechaDocumento(b?.fecha_documento);
      return fechaB - fechaA;
    });

    const prioritario = ordenados.find(oficio => this.esOficioGenerado(oficio, idSolicitud));
    return prioritario || ordenados[0];
  }

  private parsearFechaDocumento(fecha: any): number {
    if (!fecha) {
      return 0;
    }

    if (fecha instanceof Date) {
      return fecha.getTime();
    }

    const parsed = Date.parse(fecha);
    return isNaN(parsed) ? 0 : parsed;
  }

  private construirCandidatosDescarga(oficio: any, idSolicitud: number): string[] {
    const candidatos = new Set<string>();

    if (!oficio || typeof oficio !== 'object') {
      return [];
    }

    if (typeof oficio?.id === 'number') {
      candidatos.add(`oficio_${oficio.id}.pdf`);
    }

    if (typeof idSolicitud === 'number') {
      candidatos.add(`oficio_${idSolicitud}.pdf`);
      candidatos.add(`resolucion_${idSolicitud}.pdf`);
      candidatos.add(`resolucion_reingreso_${idSolicitud}.pdf`);
    }

    [
      oficio.ruta_documento,
      oficio.ruta,
      oficio.path,
      oficio.nombreArchivo,
      oficio.nombre
    ].forEach(valor => {
      if (typeof valor === 'string' && valor.trim().length > 0) {
        candidatos.add(valor.trim());
      }
    });

    return Array.from(candidatos);
  }

  private encontrarDocumentoResolucion(idSolicitud: number): DocumentosDTORespuesta | undefined {
    const solicitud = this.obtenerSolicitudCompleta(idSolicitud);
    if (!solicitud || !solicitud.documentos || solicitud.documentos.length === 0) {
      return undefined;
    }

    const esDocumentoResolucion = (nombre: string, ruta?: string): boolean => {
      if (!nombre) {
        return false;
      }

      const nombreNormalizado = nombre.toLowerCase();
      const nombreSinExtension = nombreNormalizado.replace(/\.[^/.]+$/, '').trim();

      if (this.nombresDocumentosRequeridos.includes(nombreNormalizado) || this.nombresDocumentosRequeridos.includes(nombreSinExtension)) {
        return false;
      }

      const patronesResolucion = /(resoluci[oó]n|oficio|respuesta)/i;
      if (patronesResolucion.test(nombre)) {
        return true;
      }

      if (ruta && patronesResolucion.test(ruta)) {
        return true;
      }

      if (ruta && patronesResolucion.test(ruta)) {
        return true;
      }

      return nombreNormalizado.endsWith('.pdf') && !this.nombresDocumentosRequeridos.includes(nombreSinExtension);
    };

    const documentosResolucion = solicitud.documentos
      .filter(doc => esDocumentoResolucion(doc.nombre, doc.ruta_documento))
      .sort((a, b) => {
        const fechaA = this.parsearFechaDocumento(a?.fecha_documento);
        const fechaB = this.parsearFechaDocumento(b?.fecha_documento);
        return fechaB - fechaA;
      });

    return documentosResolucion.length > 0 ? documentosResolucion[0] : undefined;
  }

  private descargarDocumentoResolucion(documento: DocumentosDTORespuesta, idSolicitud: number): void {
    const nombreDescarga = this.extraerNombreDesdeRuta(documento.nombre || documento.ruta_documento) || 'oficio_reingreso.pdf';
    this.logger.debug('Descargando documento de resolución', documento);

    this.reingresoService.descargarArchivo(documento.nombre)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (blob: Blob) => {
        descargarBlob(blob, nombreDescarga);
        this.snackbar.exito('Oficio descargado exitosamente');
      },
      error: (err) => {
        this.logger.error('Error al descargar documento de resolución por nombre', err);
        this.obtenerOficiosYDescargar(idSolicitud, nombreDescarga);
      }
    });
  }

  private esOficioGenerado(oficio: any, idSolicitud: number): boolean {
    if (!oficio || typeof oficio !== 'object') {
      return false;
    }

    const patrones = /(resoluci[oó]n|oficio)/i;
    const camposTexto = [
      oficio.nombre,
      oficio.nombreArchivo,
      oficio.ruta_documento,
      oficio.ruta,
      oficio.path,
      oficio.tipo,
      oficio.tipoDocumento,
      oficio.tipoDocumentoSolicitud,
      oficio.tipoDocumentoSolicitudReingreso,
      oficio.id,
      oficio.id_documento,
      oficio.idDocumento
    ];

    return camposTexto.some(valor => {
      if (typeof valor === 'string') {
        if (patrones.test(valor)) {
          return true;
        }
        return valor.includes(`${idSolicitud}`);
      }
      if (typeof valor === 'number') {
        return valor === idSolicitud;
      }
      return false;
    });
  }

  private obtenerIdOficio(oficio: any): number | null {
    if (!oficio || typeof oficio !== 'object') {
      return null;
    }

    const posiblesClaves = ['id', 'id_documento', 'idDocumento', 'idOficio'];
    for (const clave of posiblesClaves) {
      const valor = oficio[clave];
      if (typeof valor === 'number' && !isNaN(valor)) {
        return valor;
      }
      if (typeof valor === 'string' && valor.trim() !== '' && !isNaN(Number(valor))) {
        return Number(valor);
      }
    }

    return null;
  }

  private descargarOficioPorId(idOficio: number, nombreArchivo: string, onError: () => void): void {
    this.logger.debug('Intentando descargar oficio por ID', { idOficio, nombreArchivo });
    this.reingresoService.descargarOficio(idOficio)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (blob: Blob) => {
        const nombreFinal = nombreArchivo || `oficio_reingreso_${idOficio}.pdf`;
        descargarBlob(blob, nombreFinal);
        this.snackbar.exito('Oficio descargado exitosamente');
      },
      error: (err) => {
        this.logger.error(`Error al descargar oficio por ID ${idOficio}`, err);
        onError();
      }
    });
  }

  private descargarOficioPorCandidatos(candidatos: string[], nombreDescarga: string, idSolicitud: number, indice = 0): void {
    if (indice >= candidatos.length) {
      this.logger.warn('Ninguno de los nombres candidatos funcionó, usando flujo alternativo.');
      this.descargarArchivoPorNombre(nombreDescarga, nombreDescarga, idSolicitud);
      return;
    }

    const nombreActual = candidatos[indice];
    this.logger.debug('Intentando descargar oficio usando nombre', { nombreActual, indice, total: candidatos.length });

    this.reingresoService.descargarArchivo(nombreActual)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (blob: Blob) => {
        const nombreFinal = nombreDescarga || this.extraerNombreDesdeRuta(nombreActual) || `oficio_${idSolicitud}.pdf`;
        descargarBlob(blob, nombreFinal);
        this.snackbar.exito('Oficio descargado exitosamente');
      },
      error: (err) => {
        this.logger.debug(`Error al descargar usando "${nombreActual}". Probando siguiente opción...`, err);
        this.descargarOficioPorCandidatos(candidatos, nombreDescarga, idSolicitud, indice + 1);
      }
    });
  }

  private extraerNombreDesdeRuta(ruta: string | undefined): string {
    if (!ruta) {
      return '';
    }
    const partes = ruta.split(/[\\/]/);
    return partes[partes.length - 1] || ruta;
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
      `OFICIO_REINGRESO_${codigoUsuario}_${año} (1).pdf`,
      `OFICIO_REINGRESO_${codigoUsuario}_${año}.pdf`,
      `oficio_reingreso_${codigoUsuario}_${año}.pdf`,
      `reingreso_${codigoUsuario}_${año}.pdf`,
      `oficio_${idSolicitud}.pdf`,
      `reingreso_${idSolicitud}.pdf`
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
}
