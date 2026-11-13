import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { PruebasEcaesService, FechaEcaes, SolicitudEcaesRequest, SolicitudEcaesResponse } from '../../../core/services/pruebas-ecaes.service';
import { ArchivosService } from '../../../core/services/archivos.service';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { FileUploadComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { InfoPreregistroDialogComponent } from '../../../shared/components/info-preregistro-dialog/info-preregistro-dialog.component';
import { VerComentariosDialogComponent, VerComentariosDialogData } from '../../../shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component';
import { Archivo, Solicitud } from '../../../core/models/procesos.model';
import { ESTADOS_SOLICITUD_LABELS, EstadosSolicitud } from '../../../core/enums/estados-solicitud.enum';
import { normalizarEstado } from '../../../core/utils/estado-solicitud.util';
import { formatearFecha } from '../../../core/utils/fecha.util';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';
import { getPeriodoActual } from '../../../core/utils/periodo.utils';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-pruebas-ecaes',
  imports: [
    CommonModule,
    MatSelectModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    CardContainerComponent,
    FileUploadComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './pruebas-ecaes.component.html',
  styleUrl: './pruebas-ecaes.component.css'
})
export class PruebasEcaesComponent implements OnInit, OnDestroy {

  // Datos de fechas
  fechasEcaes: FechaEcaes[] = [];
  fechasSeleccionadas: FechaEcaes | null = null;
  periodoSeleccionado: string = '';

  // Configuración de la tabla
  displayedColumns: string[] = ['concepto', 'fecha'];
  conceptosFechas = [
    { concepto: 'Inscripción de estudiantes por parte de la Facultad', campo: 'inscripcion_est_by_facultad' },
    { concepto: 'Registro y recaudo ordinario', campo: 'registro_recaudo_ordinario' },
    { concepto: 'Registro y recaudo extraordinario', campo: 'registro_recaudo_extraordinario' },
    { concepto: 'Citación', campo: 'citacion' },
    { concepto: 'Aplicación', campo: 'aplicacion' },
    { concepto: 'Resultados individuales', campo: 'resultados_individuales' }
  ];

  // Formulario de solicitud
  solicitudForm: FormGroup;
  archivos: Archivo[] = [];
  enviandoSolicitud: boolean = false;
  usuario: any = null;

  // Seguimiento de solicitudes
  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudEcaesResponse[] = [];

  // Opciones de tipo de documento (se cargan desde el backend)
  tiposDocumento: { value: string, label: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private pruebasEcaesService: PruebasEcaesService,
    private archivosService: ArchivosService,
    private snackbar: SnackbarService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private http: HttpClient,
    private notificacionesService: NotificacionesService,
    private authService: AuthService,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService,
    private periodosService: PeriodosAcademicosService
  ) {
    this.solicitudForm = this.fb.group({
      tipoDocumento: ['CC', [Validators.required, this.tipoDocumentoValido()]],
      numero_documento: ['', [Validators.required, Validators.minLength(6)]],
      fecha_expedicion: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      this.logger.log('Usuario cargado desde localStorage:', this.usuario);
      
      // Establecer valor por defecto del número de documento
      // Usar cedula si existe, sino usar codigo como fallback
      const cedulaUsuario = this.usuario.cedula || this.usuario.codigo || '';
      if (cedulaUsuario) {
        this.solicitudForm.patchValue({
          numero_documento: cedulaUsuario
        });
        this.logger.log('Número de documento establecido por defecto:', cedulaUsuario);
      } else {
        this.logger.warn('No se encontró cédula ni código en el usuario');
      }
    } else {
      this.logger.warn('No se encontró usuario en localStorage');
    }

    this.cargarTiposDocumento();
    this.cargarFechasEcaes();
    this.listarSolicitudes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los tipos de documento disponibles desde el backend
   */
  cargarTiposDocumento(): void {
    this.http.get<any>(`${environment.apiUrl}/tipos-documento/todos`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo los valores aceptados por el backend (CC y CE)
          const valoresValidos = ['CC', 'CE'];
          this.tiposDocumento = response.data
            .filter((tipo: any) => valoresValidos.includes(tipo.codigo))
            .map((tipo: any) => ({
              value: tipo.codigo,
              label: tipo.descripcion
            }));
          
          // Si después del filtro no hay valores, usar fallback
          if (this.tiposDocumento.length === 0) {
            this.logger.warn('El backend no devolvió valores válidos (CC o CE), usando fallback');
            this.cargarTiposDocumentoFallback();
          } else {
            this.logger.log('Tipos de documento cargados desde backend (filtrados):', this.tiposDocumento);
          }
        } else {
          this.cargarTiposDocumentoFallback();
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar tipos de documento:', error);
        this.cargarTiposDocumentoFallback();
      }
    });
  }

  /**
   * Fallback con tipos de documento hardcodeados si el backend no está disponible
   * Solo incluye los valores aceptados por el backend: CC y CE
   */
  private cargarTiposDocumentoFallback(): void {
    this.tiposDocumento = [
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'CE', label: 'Cédula de Extranjería' }
    ];
    this.logger.warn('Usando tipos de documento fallback (solo CC y CE)');
  }

  /**
   * Validador personalizado para tipo de documento
   * Solo acepta CC (Cédula de Ciudadanía) o CE (Cédula de Extranjería)
   */
  private tipoDocumentoValido(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      const valoresValidos = ['CC', 'CE'];
      
      if (!valor) {
        return null; // El validador required ya maneja esto
      }
      
      if (!valoresValidos.includes(valor)) {
        return { tipoDocumentoInvalido: true };
      }
      
      return null;
    };
  }

  cargarFechasEcaes(): void {
    this.pruebasEcaesService.listarFechasEcaes().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (fechas) => {
        this.fechasEcaes = fechas;
        if (fechas.length > 0) {
          // Seleccionar el primer período por defecto
          this.periodoSeleccionado = fechas[0].periodoAcademico;
          this.fechasSeleccionadas = fechas[0];
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar fechas ECAES:', error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackbar.error(mensaje || 'Error al cargar las fechas de ECAES');
      }
    });
  }

  onPeriodoChange(): void {
    this.fechasSeleccionadas = this.fechasEcaes.find(fecha =>
      fecha.periodoAcademico === this.periodoSeleccionado
    ) || null;
  }

  /** Fecha del calendario ECAES (dd/mm/aaaa). Solo cuenta el día: se descarta la hora, si viene. */
  getConceptoFecha(campo: string): string {
    if (!this.fechasSeleccionadas) return '';
    const valor = this.fechasSeleccionadas[campo as keyof FechaEcaes] as string | undefined;
    return formatearFecha(valor?.split('T')[0]);
  }

  // ================================
  // Métodos para manejo de archivos
  // ================================

  onArchivosChange(archivos: Archivo[]): void {
    this.archivos = archivos;
  }

  // ================================
  // Métodos para envío de solicitud
  // ================================

  enviarSolicitud(): void {
    if (this.solicitudForm.invalid) {
      this.snackbar.advertencia('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.archivos.length === 0) {
      this.snackbar.advertencia('Debe adjuntar al menos un archivo');
      return;
    }

    if (!this.usuario) {
      this.logger.error('No se puede enviar solicitud: usuario no encontrado.');
      this.snackbar.error('Error: Usuario no encontrado. Inicie sesión nuevamente.');
      return;
    }

    this.enviandoSolicitud = true;
    const formValue = this.solicitudForm.value;

    this.logger.log('Iniciando proceso de envío de solicitud...');
    this.logger.log('Archivos a subir:', this.archivos);

    // Paso 1: Subir archivos al backend
    this.subirArchivos().then(archivosSubidos => {
      this.logger.log('Archivos subidos exitosamente:', archivosSubidos);

      // Paso 2: Crear la solicitud con los archivos subidos
      this.crearSolicitudConArchivos(formValue, archivosSubidos);
    }).catch(error => {
      this.logger.error('Error al subir archivos:', error);
      const mensaje = this.errorHandler.extraerMensajeError(error);
      this.snackbar.error(mensaje || 'Error al subir los archivos. Intente nuevamente.');
      this.enviandoSolicitud = false;
    });
  }

  private async subirArchivos(): Promise<any[]> {
    const archivosSubidos: any[] = [];

    for (const archivo of this.archivos) {
      try {
        this.logger.log(`Subiendo archivo: ${archivo.nombre}`);

        // Convertir el archivo del localStorage a File si es necesario
        const file = await this.convertirArchivoAFile(archivo);

        const response = await this.archivosService.subirPDF(file).pipe(
          takeUntil(this.destroy$)
        ).toPromise();
        this.logger.log('Archivo subido:', response);

        if (!response) {
          throw new Error(`No se recibió respuesta del servidor para el archivo ${archivo.nombre}`);
        }

        // Normalizar posible nombre de propiedad que contiene la ruta en la respuesta del backend
  const r: any = response as any;
  const ruta = r.ruta_documento ?? r.rutaDocumento ?? r.ruta ?? r.path ?? r.url ?? r.data?.ruta_documento ?? r.data?.path ?? null;

  this.logger.debug('Ruta detectada en respuesta:', ruta, ' (response keys):', Object.keys(r || {}));

        if (!ruta) {
          // Si la ruta no está presente, lanzamos un error claro para evitar enviar un body inválido
          throw new Error(`La respuesta del servidor para el archivo ${archivo.nombre} no contiene la ruta del documento (ruta_documento). Respuesta recibida: ${JSON.stringify(response)}`);
        }

        // Agregar el archivo subido con la estructura esperada
        archivosSubidos.push({
          nombre: response.nombre || archivo.nombre,
          ruta_documento: ruta,
          fecha_documento: new Date().toISOString(),
          esValido: true,
          comentario: 'Documento adjunto para inscripción ECAES',
          tipoDocumentoSolicitudPazYSalvo: 'ECAES'
        });
      } catch (error) {
        this.logger.error(`Error al subir archivo ${archivo.nombre}:`, error);
        throw error;
      }
    }

    return archivosSubidos;
  }

  private async convertirArchivoAFile(archivo: Archivo): Promise<File> {
    // Si el archivo ya tiene la propiedad file (objeto File nativo), lo retornamos directamente
    if (archivo.file) {
      return archivo.file;
    }

    // Si el archivo es un File directamente, lo retornamos
    if (archivo instanceof File) {
      return archivo;
    }

    throw new Error(`No se pudo obtener el archivo ${archivo.nombre}. Asegúrese de que el archivo fue seleccionado correctamente.`);
  }

  private crearSolicitudConArchivos(formValue: any, archivosSubidos: any[]): void {
    // Obtener nombre completo del usuario
    const nombreCompleto = this.usuario?.nombre_completo || 
                          this.usuario?.nombre || 
                          'Usuario';
    const nombreFinal = nombreCompleto.trim() !== '' ? nombreCompleto.trim() : 'Usuario';
    
    // Formato: "Solicitud ECAES - [nombre del estudiante]"
    const nombreSolicitud = `Solicitud ECAES - ${nombreFinal}`;

    // Obtener período académico actual
    const periodoActual = this.periodosService.getPeriodoActualValue();
    const periodoAcademico = periodoActual?.valor || getPeriodoActual();
    
    const solicitud = {
      nombre_solicitud: nombreSolicitud,
      fecha_registro_solicitud: new Date().toISOString(),
      periodo_academico: periodoAcademico, // Obligatorio
      fecha_ceremonia: null, // Opcional, se puede agregar un campo en el formulario si es necesario
      objUsuario: {
        id_usuario: this.usuario.id_usuario,
        nombre_completo: this.usuario.nombre_completo,
        codigo: this.usuario.codigo,
        cedula: this.usuario.cedula || this.usuario.codigo, // Usar cedula si existe, sino codigo
        correo: this.usuario.correo || this.usuario.email_usuario,
        estado_usuario: this.usuario.estado_usuario,
        // Enviar solo los identificadores que el backend ahora espera
        id_rol: this.usuario.id_rol ?? this.usuario.objRol?.id_rol ?? this.usuario.rol?.id_rol ?? 1,
        id_programa: this.usuario.id_programa ?? this.usuario.objPrograma?.id_programa ?? 1
      },
      tipoDocumento: formValue.tipoDocumento,
      numero_documento: formValue.numero_documento,
      fecha_expedicion: formValue.fecha_expedicion.toISOString(),
      fecha_nacimiento: formValue.fecha_nacimiento.toISOString(),
      documentos: archivosSubidos
    };

    this.logger.log('Creando solicitud con archivos subidos:', solicitud);
    this.logger.debug('Usuario completo:', this.usuario);

    this.pruebasEcaesService.crearSolicitudEcaes(solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: SolicitudEcaesResponse) => {
        this.logger.log('Solicitud creada en backend:', response);

        this.notificacionesService.actualizarNotificaciones();

        // El backend ya crea la solicitud en estado ENVIADA
        this.snackbar.exito('Solicitud enviada exitosamente');
        this.limpiarFormulario();
        this.listarSolicitudes();
      },
      error: (error) => {
        this.logger.error('Error al enviar solicitud:', error);
        this.logger.error('Error details:', error.error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        const textoCompleto = mensaje
          ? `${mensaje} Debe corregir los datos y volver a adjuntar los documentos.`
          : 'Error al enviar la solicitud. Debe volver a adjuntar los documentos.';
        this.snackbar.error(textoCompleto);
        this.enviandoSolicitud = false;
        // Limpiar archivos para evitar reutilizar rutas o referencias inválidas en el próximo intento.
        // El backend puede invalidar archivos subidos cuando la creación falla (ej. validación).
        this.archivos = [];
      }
    });
  }

  limpiarFormulario(): void {
    this.solicitudForm.reset({
      tipoDocumento: 'CC',
      numero_documento: '',
      fecha_expedicion: '',
      fecha_nacimiento: ''
    });
    this.archivos = [];
    this.enviandoSolicitud = false;
  }

  // ================================
  // Métodos de validación
  // ================================

  esCampoInvalido(campo: string): boolean {
    const control = this.solicitudForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(campo: string): string {
    const control = this.solicitudForm.get(campo);
    if (control?.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['minlength']) return 'Mínimo 6 caracteres';
    }
    return '';
  }

  // ================================
  // Métodos para seguimiento de solicitudes
  // ================================

  listarSolicitudes(): void {
    if (!this.usuario) {
      this.logger.error("Usuario no encontrado en localStorage.");
      return;
    }

    this.logger.debug('Usuario encontrado:', this.usuario);
    this.logger.debug('Rol:', this.usuario.rol.nombre);
    this.logger.debug('ID Usuario:', this.usuario.id_usuario);

    // Usar el endpoint específico por rol y usuario
    this.pruebasEcaesService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.logger.debug('Respuesta del backend (raw):', data);
        this.logger.debug('Tipo de respuesta:', typeof data);
        this.logger.debug('Es array:', Array.isArray(data));
        this.logger.debug('Longitud:', data?.length);
        this.procesarSolicitudes(data);
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al cargar las solicitudes');
      }
    });
  }

  procesarSolicitudes(data: SolicitudEcaesResponse[]): void {
    if (!data || !Array.isArray(data)) {
      this.logger.warn('La respuesta no es un array válido');
      this.solicitudes = [];
      this.solicitudesCompletas = [];
      return;
    }

    // Guardar las solicitudes completas
    this.solicitudesCompletas = data;

    this.solicitudes = data.map((sol: SolicitudEcaesResponse) => {
      this.logger.debug('Procesando solicitud:', sol);

      const estados = sol.estadosSolicitud || [];
      const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

      // Concatenar el nombre del estudiante al nombre de la solicitud
      const nombreCompleto = sol.objUsuario?.nombre_completo || 'Estudiante';
      const nombreConEstudiante = `${sol.nombre_solicitud} - ${nombreCompleto}`;

      const solicitudTransformada: Solicitud = {
        id: sol.id_solicitud,
        nombre: nombreConEstudiante,
        fecha: sol.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
        estado: this.mapearEstado(ultimoEstado?.estado_actual || 'Pendiente'),
        oficioUrl: '',
        comentarios: ultimoEstado?.comentario || ''
      };

      this.logger.debug('Solicitud transformada:', solicitudTransformada);
      return solicitudTransformada;
    });

    this.logger.debug('Solicitudes cargadas (transformadas):', this.solicitudes);
  }


  descargarOficio(id: number, nombreArchivo: string): void {
    this.logger.log('Descargar oficio:', id, nombreArchivo);
    // Implementar lógica para descargar oficio
  }

  mostrarInfoPreregistro(): void {
    const dialogRef = this.dialog.open(InfoPreregistroDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      data: {}
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.logger.debug('Diálogo de información cerrado');
    });
  }

  // ================================
  // Métodos auxiliares
  // ================================

  /** Código del backend; si no es un estado conocido (p. ej. "Pendiente") se muestra como enviada. */
  private mapearEstado(estadoString: string): string {
    const codigo = normalizarEstado(estadoString);
    return codigo in ESTADOS_SOLICITUD_LABELS ? codigo : EstadosSolicitud.ENVIADA;
  }

  // ================================
  // Métodos para manejo de comentarios
  // ================================

  /**
   * Obtener solicitud completa por ID
   */
  obtenerSolicitudCompleta(idSolicitud: number): SolicitudEcaesResponse | undefined {
    return this.solicitudesCompletas.find(sol => sol.id_solicitud === idSolicitud);
  }

  /**
   * Obtener comentario de rechazo de una solicitud
   */
  obtenerComentarioRechazo(solicitud: SolicitudEcaesResponse): string | null {
    if (!solicitud.estadosSolicitud || solicitud.estadosSolicitud.length === 0) {
      return null;
    }

    // Buscar el último estado de rechazo
    const ultimoEstadoRechazo = solicitud.estadosSolicitud
      .filter(estado => estado.estado_actual?.toLowerCase().includes('rechazada'))
      .pop();

    if (!ultimoEstadoRechazo) {
      return null;
    }

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

    this.logger.debug('Datos que se envían al diálogo:');
    this.logger.debug('  - Título:', `Comentarios - ${solicitudCompleta.nombre_solicitud}`);
    this.logger.debug('  - Documentos:', solicitudCompleta.documentos);
    this.logger.debug('  - Comentario de rechazo:', comentarioRechazo);

    const dialogRef = this.dialog.open(VerComentariosDialogComponent, {
      width: '700px',
      data: <VerComentariosDialogData>{
        titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
        documentos: solicitudCompleta.documentos,
        comentarioRechazo: comentarioRechazo
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.logger.debug('Diálogo de comentarios cerrado');
    });
  }

  /**
   * Verificar si una solicitud tiene comentarios
   */
  tieneComentarios(solicitudId: number): boolean {
    const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);

    if (!solicitudCompleta) {
      return false;
    }

    // Verificar si tiene comentario de rechazo
    const comentarioRechazo = this.obtenerComentarioRechazo(solicitudCompleta);
    if (comentarioRechazo && comentarioRechazo.trim()) {
      return true;
    }

    // Verificar si algún documento tiene comentarios
    if (solicitudCompleta.documentos && solicitudCompleta.documentos.length > 0) {
      return solicitudCompleta.documentos.some(doc => doc.comentario && doc.comentario.trim());
    }

    return false;
  }
}
