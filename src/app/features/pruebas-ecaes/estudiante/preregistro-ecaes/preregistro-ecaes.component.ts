import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, concatMap, from, map, throwError, toArray } from 'rxjs';

import { Archivo } from '@core/models/procesos.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { ArchivosService, PdfSubido } from '@core/services/archivos.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { LoggerService } from '@core/services/logger.service';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { PruebasEcaesService, SolicitudEcaesRequest } from '@core/services/pruebas-ecaes.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { getPeriodoActual } from '@core/utils/periodo.utils';
import { usuarioParaSolicitud } from '@core/utils/usuario-solicitud.util';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';

type DocumentoEcaes = SolicitudEcaesRequest['documentos'][number];

/** Los únicos tipos de documento que acepta el backend. */
const TIPOS_VALIDOS = ['CC', 'CE'];

const TIPOS_DOCUMENTO_FIJOS = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
];

/** Solo CC o CE; el vacío lo controla `required`. */
function tipoDocumentoValido(control: AbstractControl): ValidationErrors | null {
  return control.value && !TIPOS_VALIDOS.includes(control.value) ? { tipoDocumentoInvalido: true } : null;
}

/**
 * Tarjeta "Documentación Adjunta" de ECAES: datos del documento de identidad, el PDF de la cédula
 * y el envío (sube los archivos uno a uno y luego crea la solicitud). Emite `enviada` al crearla.
 */
@Component({
  selector: 'app-preregistro-ecaes',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    CardContainerComponent,
    FileUploadComponent,
  ],
  templateUrl: './preregistro-ecaes.component.html',
  styleUrls: ['../../../solicitud-estudiante-comun.css', '../ecaes-formularios.css', './preregistro-ecaes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreregistroEcaesComponent implements OnInit {
  private pruebasEcaesService = inject(PruebasEcaesService);
  private archivosService = inject(ArchivosService);
  private notificacionesService = inject(NotificacionesService);
  private periodosService = inject(PeriodosAcademicosService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  readonly usuario = input<UsuarioSesion | null>(null);
  readonly enviada = output<void>();

  readonly solicitudForm = this.fb.group({
    tipoDocumento: ['CC', [Validators.required, tipoDocumentoValido]],
    numero_documento: ['', [Validators.required, Validators.minLength(6)]],
    fecha_expedicion: [null as Date | null, Validators.required],
    fecha_nacimiento: [null as Date | null, Validators.required],
  });

  readonly archivos = signal<Archivo[]>([]);
  readonly enviandoSolicitud = signal(false);
  /** Opciones del selector; se cargan del backend. */
  readonly tiposDocumento = signal<{ value: string; label: string }[]>([]);

  ngOnInit(): void {
    // Por defecto, la cédula del estudiante o, si no la tiene, su código
    const usuario = this.usuario();
    const documento = usuario?.cedula || usuario?.codigo || '';
    if (documento) this.solicitudForm.patchValue({ numero_documento: documento });
    this.cargarTiposDocumento();
  }

  /** Tipos del backend, solo CC y CE; si no llega ninguno, los fijos. */
  cargarTiposDocumento(): void {
    this.pruebasEcaesService
      .listarTiposDocumento()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tipos) => {
          const validos = tipos
            .filter((tipo) => TIPOS_VALIDOS.includes(tipo.codigo))
            .map((tipo) => ({ value: tipo.codigo, label: tipo.descripcion }));
          this.tiposDocumento.set(validos.length > 0 ? validos : TIPOS_DOCUMENTO_FIJOS);
        },
        error: (error) => {
          this.logger.error('Error al cargar tipos de documento:', error);
          this.tiposDocumento.set(TIPOS_DOCUMENTO_FIJOS);
        },
      });
  }

  onArchivosChange(archivos: Archivo[]): void {
    this.archivos.set(archivos);
  }

  /** 1. Sube los archivos; 2. crea la solicitud con ellos. */
  enviarSolicitud(): void {
    if (this.solicitudForm.invalid) {
      this.snackbar.advertencia('Por favor complete todos los campos requeridos');
      return;
    }
    if (this.archivos().length === 0) {
      this.snackbar.advertencia('Debe adjuntar al menos un archivo');
      return;
    }
    const usuario = this.usuario();
    if (!usuario) {
      this.snackbar.error('Error: Usuario no encontrado. Inicie sesión nuevamente.');
      return;
    }

    this.enviandoSolicitud.set(true);
    const solicitud = this.armarSolicitud(usuario);
    this.subirArchivos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (documentos) => this.crearSolicitud({ ...solicitud, documentos }),
        error: (error) => {
          // Los archivos se quedan en la lista para reintentar
          this.logger.error('Error al subir archivos:', error);
          this.snackbar.error(
            this.errorHandler.extraerMensajeError(error) || 'Error al subir los archivos. Intente nuevamente.'
          );
          this.enviandoSolicitud.set(false);
        },
      });
  }

  /** Uno tras otro, en el orden de la lista. */
  private subirArchivos(): Observable<DocumentoEcaes[]> {
    return from(this.archivos()).pipe(
      concatMap((archivo) =>
        archivo.file
          ? this.archivosService.subirPDF(archivo.file).pipe(map((respuesta) => this.aDocumento(respuesta, archivo)))
          : throwError(
              () =>
                new Error(
                  `No se pudo obtener el archivo ${archivo.nombre}. Asegúrese de que el archivo fue seleccionado correctamente.`
                )
            )
      ),
      toArray()
    );
  }

  private aDocumento(respuesta: PdfSubido | null, archivo: Archivo): DocumentoEcaes {
    // Sin la ruta, el backend rechazaría la solicitud: mejor fallar aquí con un mensaje claro
    if (!respuesta?.ruta) {
      throw new Error(`La respuesta del servidor para el archivo ${archivo.nombre} no contiene la ruta del documento.`);
    }
    return {
      nombre: respuesta.nombre || archivo.nombre,
      ruta_documento: respuesta.ruta,
      fecha_documento: new Date().toISOString(),
      esValido: true,
      comentario: 'Documento adjunto para inscripción ECAES',
      tipoDocumentoSolicitudPazYSalvo: 'ECAES',
    };
  }

  private armarSolicitud(usuario: UsuarioSesion): SolicitudEcaesRequest {
    const datos = this.solicitudForm.getRawValue();
    return {
      nombre_solicitud: `Solicitud ECAES - ${usuario.nombre_completo?.trim() || 'Usuario'}`,
      fecha_registro_solicitud: new Date().toISOString(),
      periodo_academico: this.periodosService.getPeriodoActualValue()?.valor || getPeriodoActual(),
      fecha_ceremonia: null,
      objUsuario: usuarioParaSolicitud(usuario),
      tipoDocumento: datos.tipoDocumento ?? '',
      numero_documento: datos.numero_documento ?? '',
      // El formulario es válido: las dos fechas están puestas
      fecha_expedicion: datos.fecha_expedicion?.toISOString() ?? '',
      fecha_nacimiento: datos.fecha_nacimiento?.toISOString() ?? '',
      documentos: [],
    };
  }

  private crearSolicitud(solicitud: SolicitudEcaesRequest): void {
    this.pruebasEcaesService
      .crearSolicitudEcaes(solicitud)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // El backend la crea ya en estado ENVIADA
          this.notificacionesService.actualizarNotificaciones();
          this.snackbar.exito('Solicitud enviada exitosamente');
          this.limpiarFormulario();
          this.enviada.emit();
        },
        error: (error) => {
          this.logger.error('Error al enviar solicitud:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackbar.error(
            mensaje
              ? `${mensaje} Debe corregir los datos y volver a adjuntar los documentos.`
              : 'Error al enviar la solicitud. Debe volver a adjuntar los documentos.'
          );
          this.enviandoSolicitud.set(false);
          // El backend puede invalidar los archivos subidos si la creación falla: hay que adjuntarlos otra vez
          this.archivos.set([]);
        },
      });
  }

  limpiarFormulario(): void {
    this.solicitudForm.reset({
      tipoDocumento: 'CC',
      numero_documento: '',
      fecha_expedicion: null,
      fecha_nacimiento: null,
    });
    this.archivos.set([]);
    this.enviandoSolicitud.set(false);
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.solicitudForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(campo: string): string {
    const errores = this.solicitudForm.get(campo)?.errors;
    if (errores?.['required']) return 'Este campo es requerido';
    if (errores?.['minlength']) return 'Mínimo 6 caracteres';
    return '';
  }
}
