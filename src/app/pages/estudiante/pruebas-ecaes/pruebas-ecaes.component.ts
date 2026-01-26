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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { ComentariosDialogComponent, ComentariosDialogData } from '../../../shared/components/comentarios-dialog/comentarios-dialog.component';
import { Archivo, Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';

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
    MatSnackBarModule,
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
    private snackBar: MatSnackBar,
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
      tipoDocumento: ['CC', Validators.required],
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
      this.logger.log('👤 Usuario cargado desde localStorage:', this.usuario);
    } else {
      this.logger.warn('⚠️ No se encontró usuario en localStorage');
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
          this.tiposDocumento = response.data.map((tipo: any) => ({
            value: tipo.codigo,
            label: tipo.descripcion
          }));
          this.logger.log('📄 Tipos de documento cargados desde backend:', this.tiposDocumento);
        } else {
          this.cargarTiposDocumentoFallback();
        }
      },
      error: (error) => {
        this.logger.error('❌ Error al cargar tipos de documento:', error);
        this.cargarTiposDocumentoFallback();
      }
    });
  }

  /**
   * Fallback con tipos de documento hardcodeados si el backend no está disponible
   */
  private cargarTiposDocumentoFallback(): void {
    this.tiposDocumento = [
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'TI', label: 'Tarjeta de Identidad' },
      { value: 'CE', label: 'Cédula de Extranjería' },
      { value: 'PA', label: 'Pasaporte' },
      { value: 'RC', label: 'Registro Civil' },
      { value: 'NIT', label: 'Número de Identificación Tributaria' },
      { value: 'NUIP', label: 'Número Único de Identificación Personal' }
    ];
    this.logger.log('📄 Tipos de documento fallback cargados:', this.tiposDocumento);
    this.snackBar.open('⚠️ Usando tipos de documento predeterminados. Verifique la conexión con el backend.', 'Cerrar', { duration: 5000 });
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
        this.snackBar.open(mensaje || 'Error al cargar las fechas de ECAES', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onPeriodoChange(): void {
    this.fechasSeleccionadas = this.fechasEcaes.find(fecha =>
      fecha.periodoAcademico === this.periodoSeleccionado
    ) || null;
  }

  private parseFechaSinZona(fecha: string): Date | null {
    if (!fecha) {
      return null;
    }

    const soloFecha = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const partes = soloFecha.split('-');

    if (partes.length !== 3) {
      return new Date(fecha);
    }

    const year = Number(partes[0]);
    const month = Number(partes[1]) - 1; // JS months 0-based
    const day = Number(partes[2]);

    return new Date(year, month, day);
  }

  getFechaFormateada(fecha: string): string {
    const fechaObj = this.parseFechaSinZona(fecha);

    if (!fechaObj || isNaN(fechaObj.getTime())) {
      return '';
    }

    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getConceptoFecha(campo: string): string {
    if (!this.fechasSeleccionadas) return '';
    return this.getFechaFormateada(this.fechasSeleccionadas[campo as keyof FechaEcaes] as string);
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
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.archivos.length === 0) {
      this.snackBar.open('Debe adjuntar al menos un archivo', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.usuario) {
      this.logger.error('❌ No se puede enviar solicitud: usuario no encontrado.');
      this.snackBar.open('Error: Usuario no encontrado. Inicie sesión nuevamente.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.enviandoSolicitud = true;
    const formValue = this.solicitudForm.value;

    this.logger.log('📤 Iniciando proceso de envío de solicitud...');
    this.logger.log('📁 Archivos a subir:', this.archivos);

    // Paso 1: Subir archivos al backend
    this.subirArchivos().then(archivosSubidos => {
      this.logger.log('✅ Archivos subidos exitosamente:', archivosSubidos);

      // Paso 2: Crear la solicitud con los archivos subidos
      this.crearSolicitudConArchivos(formValue, archivosSubidos);
    }).catch(error => {
      this.logger.error('❌ Error al subir archivos:', error);
      const mensaje = this.errorHandler.extraerMensajeError(error);
      this.snackBar.open(mensaje || 'Error al subir los archivos. Intente nuevamente.', 'Cerrar', { duration: 5000 });
      this.enviandoSolicitud = false;
    });
  }

  private async subirArchivos(): Promise<any[]> {
    const archivosSubidos: any[] = [];

    for (const archivo of this.archivos) {
      try {
        this.logger.log(`📤 Subiendo archivo: ${archivo.nombre}`);

        // Convertir el archivo del localStorage a File si es necesario
        const file = await this.convertirArchivoAFile(archivo);

        const response = await this.archivosService.subirPDF(file).pipe(
          takeUntil(this.destroy$)
        ).toPromise();
        this.logger.log(`✅ Archivo subido:`, response);

        if (!response) {
          throw new Error(`No se recibió respuesta del servidor para el archivo ${archivo.nombre}`);
        }

        // Normalizar posible nombre de propiedad que contiene la ruta en la respuesta del backend
  const r: any = response as any;
  const ruta = r.ruta_documento ?? r.rutaDocumento ?? r.ruta ?? r.path ?? r.url ?? r.data?.ruta_documento ?? r.data?.path ?? null;

  this.logger.debug('🔎 Ruta detectada en respuesta:', ruta, ' (response keys):', Object.keys(r || {}));

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
        this.logger.error(`❌ Error al subir archivo ${archivo.nombre}:`, error);
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
    const periodoAcademico = periodoActual?.valor || this.obtenerPeriodoActualFallback();
    
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

    this.logger.log('📋 Creando solicitud con archivos subidos:', solicitud);
    this.logger.debug('👤 Usuario completo:', this.usuario);

    this.pruebasEcaesService.crearSolicitudEcaes(solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: SolicitudEcaesResponse) => {
        this.logger.log('✅ Solicitud creada en backend:', response);

        // Actualizar notificaciones después de crear la solicitud
        const usuario = this.authService.getUsuario();
        if (usuario?.id_usuario) {
          this.notificacionesService.actualizarNotificaciones(usuario.id_usuario);
        }

        // Actualizar el estado a "ENVIADA" (opcional, no bloquea el flujo)
        this.pruebasEcaesService.actualizarEstadoSolicitud(response.id_solicitud, 'ENVIADA').pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.logger.log('✅ Estado actualizado a ENVIADA');
            this.snackBar.open('Solicitud enviada exitosamente ✅', 'Cerrar', { duration: 3000 });
            this.limpiarFormulario();
            this.listarSolicitudes(); // Recargar la lista de solicitudes
          },
          error: (error) => {
            this.logger.warn('⚠️ Error al actualizar estado (CORS o backend):', error);
            // No mostramos error al usuario, la solicitud se creó correctamente
            this.snackBar.open('Solicitud enviada exitosamente ✅', 'Cerrar', { duration: 3000 });
            this.limpiarFormulario();
            this.listarSolicitudes();
          }
        });
      },
      error: (error) => {
        this.logger.error('Error al enviar solicitud:', error);
        this.logger.error('Error details:', error.error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackBar.open(mensaje || 'Error al enviar la solicitud', 'Cerrar', { duration: 5000 });
        this.enviandoSolicitud = false;
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
      this.logger.error("❌ Usuario no encontrado en localStorage.");
      return;
    }

    this.logger.debug('🔍 Usuario encontrado:', this.usuario);
    this.logger.debug('🔍 Rol:', this.usuario.rol.nombre);
    this.logger.debug('🔍 ID Usuario:', this.usuario.id_usuario);

    // Usar el endpoint específico por rol y usuario
    this.pruebasEcaesService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.logger.debug('📡 Respuesta del backend (raw):', data);
        this.logger.debug('📡 Tipo de respuesta:', typeof data);
        this.logger.debug('📡 Es array:', Array.isArray(data));
        this.logger.debug('📡 Longitud:', data?.length);
        this.procesarSolicitudes(data);
      },
      error: (err) => {
        this.logger.error('❌ Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar las solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  procesarSolicitudes(data: SolicitudEcaesResponse[]): void {
    if (!data || !Array.isArray(data)) {
      this.logger.warn('⚠️ La respuesta no es un array válido');
      this.solicitudes = [];
      this.solicitudesCompletas = [];
      return;
    }

    // Guardar las solicitudes completas
    this.solicitudesCompletas = data;

    this.solicitudes = data.map((sol: SolicitudEcaesResponse) => {
      this.logger.debug('🔍 Procesando solicitud:', sol);

      const estados = sol.estadosSolicitud || [];
      const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

      // Concatenar el nombre del estudiante al nombre de la solicitud
      const nombreCompleto = sol.objUsuario?.nombre_completo || 'Estudiante';
      const nombreConEstudiante = `${sol.nombre_solicitud} - ${nombreCompleto}`;

      const solicitudTransformada: Solicitud = {
        id: sol.id_solicitud,
        nombre: nombreConEstudiante,
        fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
        estado: this.mapearEstado(ultimoEstado?.estado_actual || 'Pendiente'),
        oficioUrl: '',
        comentarios: ultimoEstado?.comentario || ''
      };

      this.logger.debug('✅ Solicitud transformada:', solicitudTransformada);
      return solicitudTransformada;
    });

    this.logger.debug('📋 Solicitudes cargadas (transformadas):', this.solicitudes);
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

  private mapearEstado(estadoString: string): SolicitudStatusEnum {
    switch (estadoString.toLowerCase()) {
      case 'enviada':
        return SolicitudStatusEnum.ENVIADA;
      case 'en revisión por secretaría':
      case 'en_revision_secretaria':
        return SolicitudStatusEnum.EN_REVISION_SECRETARIA;
      case 'en revisión por funcionario':
      case 'en_revision_funcionario':
        return SolicitudStatusEnum.EN_REVISION_FUNCIONARIO;
      case 'en revisión por coordinador':
      case 'en_revision_coordinador':
        return SolicitudStatusEnum.EN_REVISION_COORDINADOR;
      case 'aprobada':
        return SolicitudStatusEnum.APROBADA;
      case 'rechazada':
        return SolicitudStatusEnum.RECHAZADA;
      case 'pre_registrado':
      case 'pre-registrado':
      case 'preregistrado':
        return SolicitudStatusEnum.PRE_REGISTRADO;
      default:
        return SolicitudStatusEnum.ENVIADA; // Estado por defecto
    }
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
      this.snackBar.open('No se encontró la información de la solicitud', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!solicitudCompleta.documentos || solicitudCompleta.documentos.length === 0) {
      this.snackBar.open('No hay documentos asociados a esta solicitud', 'Cerrar', { duration: 3000 });
      return;
    }

    // Obtener el comentario de rechazo del último estado
    const comentarioRechazo = this.obtenerComentarioRechazo(solicitudCompleta);

    this.logger.debug('📋 Datos que se envían al diálogo:');
    this.logger.debug('  - Título:', `Comentarios - ${solicitudCompleta.nombre_solicitud}`);
    this.logger.debug('  - Documentos:', solicitudCompleta.documentos);
    this.logger.debug('  - Comentario de rechazo:', comentarioRechazo);

    const dialogRef = this.dialog.open(ComentariosDialogComponent, {
      width: '700px',
      data: <ComentariosDialogData>{
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
