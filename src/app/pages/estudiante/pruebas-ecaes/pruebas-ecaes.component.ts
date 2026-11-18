import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { PruebasEcaesService, FechaEcaes, SolicitudEcaesRequest, SolicitudEcaesResponse } from '@core/services/pruebas-ecaes.service';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { usuarioParaSolicitud } from '@core/utils/usuario-solicitud.util';
import { ArchivosService } from '@core/services/archivos.service';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { InfoPreregistroDialogComponent } from './info-preregistro-dialog/info-preregistro-dialog.component';
import { Archivo, Solicitud } from '@core/models/procesos.model';
import { ESTADOS_SOLICITUD_LABELS, EstadosSolicitud } from '@core/enums/estados-solicitud.enum';
import { normalizarEstado } from '@core/utils/estado-solicitud.util';
import { formatearFecha } from '@core/utils/fecha.util';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { LoggerService } from '@core/services/logger.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { getPeriodoActual } from '@core/utils/periodo.utils';
import { SeguimientoSolicitudesBase } from '../seguimiento-solicitudes.base';

/** Valores del formulario de preregistro. */
interface FormularioEcaes {
  tipoDocumento: string;
  numero_documento: string;
  fecha_expedicion: Date;
  fecha_nacimiento: Date;
}

type DocumentoEcaes = SolicitudEcaesRequest['documentos'][number];

@Component({
  selector: 'app-pruebas-ecaes',
  imports: [
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
  styleUrl: './pruebas-ecaes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PruebasEcaesComponent extends SeguimientoSolicitudesBase<SolicitudEcaesResponse> {
  private pruebasEcaesService = inject(PruebasEcaesService);
  private archivosService = inject(ArchivosService);
  private fb = inject(FormBuilder);
  private notificacionesService = inject(NotificacionesService);
  private logger = inject(LoggerService);
  private periodosService = inject(PeriodosAcademicosService);


  // Datos de fechas
  readonly fechasEcaes = signal<FechaEcaes[]>([]);
  readonly fechasSeleccionadas = signal<FechaEcaes | null>(null);
  readonly periodoSeleccionado = signal('');

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
  readonly archivos = signal<Archivo[]>([]);
  readonly enviandoSolicitud = signal(false);

  // Opciones de tipo de documento (se cargan desde el backend)
  readonly tiposDocumento = signal<{ value: string, label: string }[]>([]);

  constructor() {
    super();
    this.solicitudForm = this.fb.group({
      tipoDocumento: ['CC', [Validators.required, this.tipoDocumentoValido()]],
      numero_documento: ['', [Validators.required, Validators.minLength(6)]],
      fecha_expedicion: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required]
    });
  }

  protected override alIniciar(): void {
    if (this.usuario) {
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
  }

  protected listar(usuario: UsuarioSesion) {
    return this.pruebasEcaesService.listarSolicitudesPorRol('ESTUDIANTE', usuario.id_usuario);
  }

  /**
   * Carga los tipos de documento disponibles desde el backend
   */
  cargarTiposDocumento(): void {
    this.pruebasEcaesService.listarTiposDocumento().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (tipos) => {
        // Solo los valores que acepta el backend (CC y CE)
        const valoresValidos = ['CC', 'CE'];
        this.tiposDocumento.set(tipos
          .filter(tipo => valoresValidos.includes(tipo.codigo))
          .map(tipo => ({ value: tipo.codigo, label: tipo.descripcion })));

        if (this.tiposDocumento().length === 0) {
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
    this.tiposDocumento.set([
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'CE', label: 'Cédula de Extranjería' }
    ]);
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
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (fechas) => {
        this.fechasEcaes.set(fechas);
        if (fechas.length > 0) {
          // Seleccionar el primer período por defecto
          this.periodoSeleccionado.set(fechas[0].periodoAcademico);
          this.fechasSeleccionadas.set(fechas[0]);
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
    this.fechasSeleccionadas.set(this.fechasEcaes().find(fecha =>
      fecha.periodoAcademico === this.periodoSeleccionado()
    ) || null);
  }

  /** Fecha del calendario ECAES (dd/mm/aaaa). Solo cuenta el día: se descarta la hora, si viene. */
  getConceptoFecha(campo: string): string {
    const fechas = this.fechasSeleccionadas();
    if (!fechas) return '';
    const valor = fechas[campo as keyof FechaEcaes] as string | undefined;
    return formatearFecha(valor?.split('T')[0]);
  }

  // ================================
  // Métodos para manejo de archivos
  // ================================

  onArchivosChange(archivos: Archivo[]): void {
    this.archivos.set(archivos);
  }

  // ================================
  // Métodos para envío de solicitud
  // ================================

  enviarSolicitud(): void {
    if (this.solicitudForm.invalid) {
      this.snackbar.advertencia('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.archivos().length === 0) {
      this.snackbar.advertencia('Debe adjuntar al menos un archivo');
      return;
    }

    if (!this.usuario) {
      this.logger.error('No se puede enviar solicitud: usuario no encontrado.');
      this.snackbar.error('Error: Usuario no encontrado. Inicie sesión nuevamente.');
      return;
    }

    this.enviandoSolicitud.set(true);
    const formValue = this.solicitudForm.value;

    this.logger.log('Iniciando proceso de envío de solicitud...');
    this.logger.log('Archivos a subir:', this.archivos());

    // Paso 1: Subir archivos al backend
    this.subirArchivos().then(archivosSubidos => {
      this.logger.log('Archivos subidos exitosamente:', archivosSubidos);

      // Paso 2: Crear la solicitud con los archivos subidos
      this.crearSolicitudConArchivos(formValue, archivosSubidos);
    }).catch(error => {
      this.logger.error('Error al subir archivos:', error);
      const mensaje = this.errorHandler.extraerMensajeError(error);
      this.snackbar.error(mensaje || 'Error al subir los archivos. Intente nuevamente.');
      this.enviandoSolicitud.set(false);
    });
  }

  private async subirArchivos(): Promise<DocumentoEcaes[]> {
    const archivosSubidos: DocumentoEcaes[] = [];

    for (const archivo of this.archivos()) {
      try {
        this.logger.log(`Subiendo archivo: ${archivo.nombre}`);

        // Convertir el archivo del localStorage a File si es necesario
        const file = await this.convertirArchivoAFile(archivo);

        const response = await this.archivosService.subirPDF(file).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).toPromise();
        this.logger.log('Archivo subido:', response);

        if (!response) {
          throw new Error(`No se recibió respuesta del servidor para el archivo ${archivo.nombre}`);
        }

        const ruta = response.ruta || null;
        this.logger.debug('Ruta detectada en respuesta:', ruta);

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

  private crearSolicitudConArchivos(formValue: FormularioEcaes, archivosSubidos: DocumentoEcaes[]): void {
    const usuario = this.usuario!;
    const nombreFinal = usuario.nombre_completo?.trim() || 'Usuario';
    
    // Formato: "Solicitud ECAES - [nombre del estudiante]"
    const nombreSolicitud = `Solicitud ECAES - ${nombreFinal}`;

    // Obtener período académico actual
    const periodoActual = this.periodosService.getPeriodoActualValue();
    const periodoAcademico = periodoActual?.valor || getPeriodoActual();
    
    const solicitud: SolicitudEcaesRequest = {
      nombre_solicitud: nombreSolicitud,
      fecha_registro_solicitud: new Date().toISOString(),
      periodo_academico: periodoAcademico, // Obligatorio
      fecha_ceremonia: null, // Opcional, se puede agregar un campo en el formulario si es necesario
      objUsuario: usuarioParaSolicitud(usuario),
      tipoDocumento: formValue.tipoDocumento,
      numero_documento: formValue.numero_documento,
      fecha_expedicion: formValue.fecha_expedicion.toISOString(),
      fecha_nacimiento: formValue.fecha_nacimiento.toISOString(),
      documentos: archivosSubidos
    };

    this.logger.log('Creando solicitud con archivos subidos:', solicitud);
    this.logger.debug('Usuario completo:', this.usuario);

    this.pruebasEcaesService.crearSolicitudEcaes(solicitud).pipe(
      takeUntilDestroyed(this.destroyRef)
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
        this.enviandoSolicitud.set(false);
        // Limpiar archivos para evitar reutilizar rutas o referencias inválidas en el próximo intento.
        // El backend puede invalidar archivos subidos cuando la creación falla (ej. validación).
        this.archivos.set([]);
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
    this.archivos.set([]);
    this.enviandoSolicitud.set(false);
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

  /** Fila de la tabla: se añade el nombre del estudiante y el estado se lleva a un código conocido. */
  protected override aFila(sol: SolicitudEcaesResponse): Solicitud {
    const fila = super.aFila(sol);
    const nombreEstudiante = sol.objUsuario?.nombre_completo || 'Estudiante';
    return {
      ...fila,
      nombre: `${sol.nombre_solicitud} - ${nombreEstudiante}`,
      estado: this.mapearEstado(fila.estado),
      oficioUrl: ''
    };
  }

  /** ECAES no tiene oficio para descargar; la tabla emite el evento igual. */
  descargarOficio(id: number, nombreArchivo: string): void {
    this.logger.log('Descargar oficio:', id, nombreArchivo);
  }

  mostrarInfoPreregistro(): void {
    this.dialog.open(InfoPreregistroDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      data: {}
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
}
