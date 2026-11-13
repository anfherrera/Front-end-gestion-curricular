import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

import { descargarBlob } from '@core/utils/download.util';
import { Archivo, Solicitud, SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { RequiredDocsComponent } from '@shared/components/required-docs/required-docs.component';
import { VerComentariosDialogComponent, VerComentariosDialogData } from '@shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component';
import { PazSalvoService } from '@core/services/paz-salvo.service';
import { estadoActual, ultimoEstado } from '@core/utils/estado-solicitud.util';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { AuthService } from '@core/services/auth.service';
import { normalizarNombreArchivo } from '@core/utils/texto.util';
import { SnackbarService } from '@core/services/snackbar.service';

/** Programas cuyo paz y salvo exige trabajo de grado y el formato PPH o TIH. */
const PROGRAMAS_CON_TRABAJO_DE_GRADO = ['sistemas', 'electronica', 'automatica', 'automatizacion'];

/** Documentos obligatorios de los demás programas que no aplican a Telemática (nombres normalizados). */
const DOCUMENTOS_NO_TELEMATICA = ['pmfo4for27', 'hojadevida', 'autorizacion', 'comprobante', 'trabajodegrado'];

/** Lo que usa esta pantalla del usuario guardado en sesión (localStorage 'usuario'). */
interface UsuarioSesion {
  id_usuario: number;
  nombre_completo?: string;
  nombre?: string;
  objPrograma?: { nombre_programa?: string; nombre?: string };
}

/** Datos con que se crea la solicitud. */
interface DatosSolicitudPazSalvo {
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  titulo_trabajo_grado?: string;
  director_trabajo_grado?: string;
}

@Component({
  selector: 'app-paz-salvo',
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
    MatDatepickerModule,
    MatNativeDateModule,
    RequestStatusTableComponent,
    FileUploadComponent,
    RequiredDocsComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['../solicitud-estudiante-comun.css', './paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit, OnDestroy {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  private destroy$ = new Subject<void>();

  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudHomologacionDTORespuesta[] = [];
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  usuario: UsuarioSesion | null = null;
  solicitudForm: FormGroup;
  requiereTrabajoGrado = false;
  maxDate: Date = new Date();

  documentosRequeridos = [
    { label: 'Formato PM-FO-4-FOR-27 (Hoja de vida académica).pdf', obligatorio: true },
    { label: 'Autorización para publicar y permitir la consulta y uso de obras en el Repositorio Institucional.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado con sus anexos.pdf', obligatorio: true },
    { label: 'Formato TI-G (Acta sustentación TRABAJO DE INVESTIGACIÓN).pdf (según modalidad)', obligatorio: false },
    { label: 'Formato TI-H (Constancia director y jurados TRABAJO DE INVESTIGACIÓN).pdf (según modalidad)', obligatorio: false },
    { label: 'Formato PP-G (Acta sustentación PRÁCTICA PROFESIONAL).pdf (según modalidad)', obligatorio: false },
    { label: 'Formato PP-H (Constancia director y jurados PRÁCTICA PROFESIONAL).pdf (según modalidad)', obligatorio: false },
    { label: 'Resultados de pruebas ECAES (opcional).pdf', obligatorio: false, opcional: true }
  ];

  // Sistemas, Electrónica y Automática adjuntan uno de estos dos (también se suben a SIMCA Web).
  // PPH (sin guion) es el acta de sustentación; PP-H (con guion) es la constancia de práctica profesional.
  archivosExclusivos: string[] = [
    'Formato PPH.pdf',
    'Formato TIH.pdf'
  ];

  optionalFiles: string[] = [
    'Fotocopia de cédula (Solo para Tecnología en Telemática).pdf'
  ];

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackbar: SnackbarService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private notificacionesService: NotificacionesService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.solicitudForm = this.fb.group({
      fecha_terminacion_plan: [null, Validators.required],
      titulo_trabajo_grado: [''],
      director_trabajo_grado: ['']
    });
  }

  ngOnInit(): void {
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
    }

    this.requiereTrabajoGrado = !this.esTelematica() && this.programaConTrabajoDeGrado();
    this.configurarValidacionesCondicionales();
    this.listarSolicitudes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Nombre del programa en minúsculas y sin tildes. */
  private programaNormalizado(): string {
    const nombre = this.usuario?.objPrograma?.nombre_programa || this.usuario?.objPrograma?.nombre || '';
    return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  private esTelematica(): boolean {
    return this.programaNormalizado().includes('telematica');
  }

  private programaConTrabajoDeGrado(): boolean {
    const programa = this.programaNormalizado();
    return PROGRAMAS_CON_TRABAJO_DE_GRADO.some(p => programa.includes(p));
  }

  /** Título y director son obligatorios solo si el programa exige trabajo de grado. */
  private configurarValidacionesCondicionales(): void {
    const tituloControl = this.solicitudForm.get('titulo_trabajo_grado');
    const directorControl = this.solicitudForm.get('director_trabajo_grado');
    const requerido = this.requiereTrabajoGrado ? [Validators.required] : [];

    tituloControl?.setValidators([...requerido, Validators.maxLength(500)]);
    directorControl?.setValidators([...requerido, Validators.maxLength(200)]);
    tituloControl?.updateValueAndValidity();
    directorControl?.updateValueAndValidity();
  }

  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
  }

  puedeEnviar(): boolean {
    if (!this.usuario || this.archivosActuales.length === 0 || !this.solicitudForm.valid) {
      return false;
    }

    const formValue = this.solicitudForm.value;
    if (!formValue.fecha_terminacion_plan) {
      return false;
    }

    if (this.requiereTrabajoGrado) {
      if (!formValue.titulo_trabajo_grado?.trim() || !formValue.director_trabajo_grado?.trim()) {
        return false;
      }
    }

    return this.obtenerDocumentosFaltantes().length === 0;
  }

  /** Documentos que faltan o que no aplican al programa del estudiante. */
  obtenerDocumentosFaltantes(): string[] {
    if (this.esTelematica()) {
      return this.validarDocumentosTelematica();
    }

    const faltantes = this.documentosRequeridos
      .filter(doc => doc.obligatorio && !this.archivoSubido(doc.label))
      .map(doc => doc.label);

    const tienePphOTih = this.archivosActuales
      .map(a => normalizarNombreArchivo(a.nombre))
      .some(n => n.includes('pph') || n.includes('tih'));
    if (this.programaConTrabajoDeGrado() && !tienePphOTih) {
      faltantes.push('Formato PPH o TIH (requerido para tu programa)');
    }

    return faltantes;
  }

  /** Telemática solo exige la cédula; los formatos de trabajo de grado no aplican. */
  private validarDocumentosTelematica(): string[] {
    const errores: string[] = [];
    const nombres = this.archivosActuales.map(a => normalizarNombreArchivo(a.nombre));

    if (nombres.some(n => n.includes('tig') || n.includes('tih'))) {
      errores.push('Los formatos TI-G/TI-H no aplican para tu programa (Telemática)');
    }
    if (nombres.some(n => n.includes('ppg') || n.includes('pph'))) {
      errores.push('Los formatos PP-G/PP-H no aplican para tu programa (Telemática)');
    }
    if (nombres.some(n => DOCUMENTOS_NO_TELEMATICA.some(d => n.includes(d)))) {
      errores.push('Los documentos obligatorios (PM-FO-4-FOR-27, Autorización, Comprobante, Trabajo de grado) no aplican para tu programa (Telemática)');
    }

    const faltantes = nombres.some(n => n.includes('cedula'))
      ? []
      : ['Fotocopia de cédula (obligatoria para Telemática)'];

    return [...faltantes, ...errores];
  }

  private archivoSubido(nombreDocumento: string): boolean {
    const nombreNormalizado = normalizarNombreArchivo(nombreDocumento);
    return this.archivosActuales.some(archivo => {
      const nombreArchivo = normalizarNombreArchivo(archivo.nombre);
      return nombreArchivo.includes(nombreNormalizado) || nombreNormalizado.includes(nombreArchivo);
    });
  }

  listarSolicitudes() {
    if (!this.usuario) {
      return;
    }
    this.pazSalvoService.listarSolicitudesPorRol('ESTUDIANTE', this.usuario.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (!Array.isArray(data)) {
            this.solicitudes = [];
            this.solicitudesCompletas = [];
            return;
          }
          this.solicitudesCompletas = data;
          this.solicitudes = data.map(sol => this.aSolicitud(sol));
        },
        error: () => this.snackbar.error('No se pudieron cargar tus solicitudes')
      });
  }

  /** Convierte la respuesta del backend en la fila de la tabla de seguimiento. */
  private aSolicitud(sol: SolicitudHomologacionDTORespuesta): Solicitud {
    return {
      id: sol.id_solicitud,
      nombre: sol.nombre_solicitud,
      fecha: sol.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
      estado: estadoActual(sol),
      comentarios: ultimoEstado(sol)?.comentario || ''
    };
  }

  onSolicitudEnviada() {
    const usuario = this.usuario;
    if (!usuario || !this.fileUploadComponent) {
      return;
    }

    // 1. Se suben los documentos sin asociarlos; 2. se crea la solicitud y el backend los asocia.
    this.fileUploadComponent.subirArchivosPendientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (archivosSubidos) => {
          this.pazSalvoService.crearSolicitudConFormulario(usuario.id_usuario, archivosSubidos, this.datosSolicitud())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => this.despuesDeEnviar(),
              error: (err) => {
                if (err.status === 400) {
                  this.snackbar.advertencia('Error de validación: revisa los datos de la solicitud');
                } else if (err.status === 401) {
                  this.snackbar.advertencia('Sesión expirada. Por favor, inicia sesión de nuevo.');
                } else {
                  this.snackbar.error('No se pudo enviar la solicitud. Inténtalo de nuevo.');
                }
              }
            });
        },
        error: () => {
          this.snackbar.error('Error al subir documentos. Por favor, inténtalo de nuevo.');
          this.fileUploadComponent?.resetearEstadoCarga();
        }
      });
  }

  /** Datos del formulario en el formato que espera el backend. */
  private datosSolicitud(): DatosSolicitudPazSalvo {
    const formValue = this.solicitudForm.value;
    const fecha = formValue.fecha_terminacion_plan instanceof Date
      ? formValue.fecha_terminacion_plan
      : new Date(formValue.fecha_terminacion_plan);

    const nombreCompleto = (this.usuario?.nombre_completo || this.usuario?.nombre || '').trim() || 'Usuario';

    const datos: DatosSolicitudPazSalvo = {
      nombre_solicitud: `Solicitud Paz y Salvo - ${nombreCompleto}`,
      fecha_registro_solicitud: fecha.toISOString().split('T')[0]
    };

    if (this.requiereTrabajoGrado) {
      const titulo = formValue.titulo_trabajo_grado?.trim();
      const director = formValue.director_trabajo_grado?.trim();
      if (titulo) datos.titulo_trabajo_grado = titulo;
      if (director) datos.director_trabajo_grado = director;
    }
    return datos;
  }

  private despuesDeEnviar(): void {
    this.listarSolicitudes();

    this.notificacionesService.actualizarNotificaciones();

    this.solicitudForm.reset({
      fecha_terminacion_plan: null,
      titulo_trabajo_grado: '',
      director_trabajo_grado: ''
    });
    this.archivosActuales = [];

    // Pulso en [reset] para que el componente de subida limpie su lista
    setTimeout(() => {
      this.resetFileUpload = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.resetFileUpload = false;
        this.cdr.detectChanges();
      }, 0);
    }, 0);

    this.snackbar.exito('¡Solicitud de paz y salvo enviada correctamente! Los documentos se asociaron automáticamente.');
  }

  private obtenerSolicitudCompleta(idSolicitud: number): SolicitudHomologacionDTORespuesta | undefined {
    return this.solicitudesCompletas.find(sol => sol.id_solicitud === idSolicitud);
  }

  verComentarios(solicitudId: number): void {
    const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);
    if (!solicitudCompleta) {
      this.snackbar.error('No se encontró la información de la solicitud');
      return;
    }

    this.pazSalvoService.obtenerComentarios(solicitudCompleta.id_solicitud).pipe(takeUntil(this.destroy$)).subscribe({
      next: (comentarios) => {
        const documentos = comentarios.documentosConComentarios?.map(doc => ({
          id: doc.id,
          nombre: doc.nombre,
          comentario: doc.comentario
        })) || [];

        this.dialog.open(VerComentariosDialogComponent, {
          width: '700px',
          data: {
            titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
            documentos,
            comentarioRechazo: comentarios.comentarioRechazo || null,
            mensaje: comentarios.mensaje || undefined
          } as VerComentariosDialogData
        });
      },
      error: () => this.snackbar.error('Error al cargar los comentarios')
    });
  }

  /**
   * Descarga el oficio de la solicitud. El servicio toma el nombre del encabezado
   * Content-Disposition o, si no viene, del primer oficio de la solicitud.
   */
  descargarOficio(idSolicitud: number, nombreArchivo: string): void {
    this.pazSalvoService.descargarOficioPorSolicitud(idSolicitud).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        descargarBlob(blob, blob.filename || nombreArchivo || `oficio_${idSolicitud}.pdf`);
        this.snackbar.exito('Oficio descargado exitosamente');
      },
      error: (err) => {
        if (err.status === 404) {
          this.snackbar.advertencia('No hay oficios disponibles para esta solicitud');
        } else {
          this.snackbar.error('Error al descargar el oficio: ' + (err.error?.message || err.message || 'Error desconocido'));
        }
      }
    });
  }
}
