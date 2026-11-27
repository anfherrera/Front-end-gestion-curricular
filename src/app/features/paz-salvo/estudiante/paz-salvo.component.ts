import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { descargarBlob } from '@core/utils/download.util';
import { Archivo, SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { Documento, RequiredDocsComponent } from '@shared/components/required-docs/required-docs.component';
import { PazSalvoService } from '@core/services/paz-salvo.service';
import { normalizarNombreArchivo } from '@core/utils/texto.util';
import { SolicitudEstudianteBase } from '../../../pages/estudiante/solicitud-estudiante.base';

/** Programas cuyo paz y salvo exige trabajo de grado y el formato PPH o TIH. */
const PROGRAMAS_CON_TRABAJO_DE_GRADO = ['sistemas', 'electronica', 'automatica', 'automatizacion'];

/** Documentos obligatorios de los demás programas que no aplican a Telemática (nombres normalizados). */
const DOCUMENTOS_NO_TELEMATICA = ['pmfo4for27', 'hojadevida', 'autorizacion', 'comprobante', 'trabajodegrado'];

/** Datos con que se crea la solicitud. */
interface DatosSolicitudPazSalvo {
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  titulo_trabajo_grado?: string;
  director_trabajo_grado?: string;
}

@Component({
  selector: 'app-paz-salvo',
  imports: [
    ReactiveFormsModule,
    CardContainerComponent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RequestStatusTableComponent,
    FileUploadComponent,
    RequiredDocsComponent,
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['../../solicitud-estudiante-comun.css', './paz-salvo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PazSalvoComponent extends SolicitudEstudianteBase<SolicitudHomologacionDTORespuesta> {
  private pazSalvoService = inject(PazSalvoService);
  private fb = inject(FormBuilder);

  readonly solicitudForm = this.fb.group({
    fecha_terminacion_plan: [null as Date | null, Validators.required],
    titulo_trabajo_grado: [''],
    director_trabajo_grado: [''],
  });
  requiereTrabajoGrado = false;
  maxDate: Date = new Date();

  protected readonly mensajeExito =
    '¡Solicitud de paz y salvo enviada correctamente! Los documentos se asociaron automáticamente.';

  documentosRequeridos: Documento[] = [
    { label: 'Formato PM-FO-4-FOR-27 (Hoja de vida académica).pdf', obligatorio: true },
    {
      label: 'Autorización para publicar y permitir la consulta y uso de obras en el Repositorio Institucional.pdf',
      obligatorio: true,
    },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado con sus anexos.pdf', obligatorio: true },
    { label: 'Formato TI-G (Acta sustentación TRABAJO DE INVESTIGACIÓN).pdf (según modalidad)', obligatorio: false },
    {
      label: 'Formato TI-H (Constancia director y jurados TRABAJO DE INVESTIGACIÓN).pdf (según modalidad)',
      obligatorio: false,
    },
    { label: 'Formato PP-G (Acta sustentación PRÁCTICA PROFESIONAL).pdf (según modalidad)', obligatorio: false },
    {
      label: 'Formato PP-H (Constancia director y jurados PRÁCTICA PROFESIONAL).pdf (según modalidad)',
      obligatorio: false,
    },
    { label: 'Resultados de pruebas ECAES (opcional).pdf', obligatorio: false, opcional: true },
  ];

  // Sistemas, Electrónica y Automática adjuntan uno de estos dos (también se suben a SIMCA Web).
  // PPH (sin guion) es el acta de sustentación; PP-H (con guion) es la constancia de práctica profesional.
  archivosExclusivos: string[] = ['Formato PPH.pdf', 'Formato TIH.pdf'];

  optionalFiles: string[] = ['Fotocopia de cédula (Solo para Tecnología en Telemática).pdf'];

  protected override alIniciar(): void {
    this.requiereTrabajoGrado = !this.esTelematica() && this.programaConTrabajoDeGrado();
    this.configurarValidacionesCondicionales();
  }

  protected listar(usuario: UsuarioSesion) {
    return this.pazSalvoService.listarSolicitudesPorRol('ESTUDIANTE', usuario.id_usuario);
  }

  /** Nombre del programa en minúsculas y sin tildes. */
  private programaNormalizado(): string {
    const nombre = this.usuario?.objPrograma?.nombre_programa || '';
    return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  esTelematica(): boolean {
    return this.programaNormalizado().includes('telematica');
  }

  private programaConTrabajoDeGrado(): boolean {
    const programa = this.programaNormalizado();
    return PROGRAMAS_CON_TRABAJO_DE_GRADO.some((p) => programa.includes(p));
  }

  /** Título y director son obligatorios solo si el programa exige trabajo de grado. */
  private configurarValidacionesCondicionales(): void {
    const tituloControl = this.solicitudForm.controls.titulo_trabajo_grado;
    const directorControl = this.solicitudForm.controls.director_trabajo_grado;
    const requerido = this.requiereTrabajoGrado ? [Validators.required] : [];

    tituloControl.setValidators([...requerido, Validators.maxLength(500)]);
    directorControl.setValidators([...requerido, Validators.maxLength(200)]);
    tituloControl.updateValueAndValidity();
    directorControl.updateValueAndValidity();
  }

  override puedeEnviar(): boolean {
    if (!super.puedeEnviar() || !this.solicitudForm.valid) {
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

    // A diferencia de homologación y reingreso, aquí los documentos faltantes sí bloquean el envío
    return this.obtenerDocumentosFaltantes().length === 0;
  }

  /** Documentos que faltan o que no aplican al programa del estudiante. */
  override obtenerDocumentosFaltantes(): string[] {
    if (this.esTelematica()) {
      return this.validarDocumentosTelematica();
    }

    const faltantes = super.obtenerDocumentosFaltantes();

    const tienePphOTih = this.archivosActuales()
      .map((a) => normalizarNombreArchivo(a.nombre))
      .some((n) => n.includes('pph') || n.includes('tih'));
    if (this.programaConTrabajoDeGrado() && !tienePphOTih) {
      faltantes.push('Formato PPH o TIH (requerido para su programa)');
    }

    return faltantes;
  }

  /** Telemática solo exige la cédula; los formatos de trabajo de grado no aplican. */
  private validarDocumentosTelematica(): string[] {
    const errores: string[] = [];
    const nombres = this.archivosActuales().map((a) => normalizarNombreArchivo(a.nombre));

    if (nombres.some((n) => n.includes('tig') || n.includes('tih'))) {
      errores.push('Los formatos TI-G/TI-H no aplican para su programa (Telemática)');
    }
    if (nombres.some((n) => n.includes('ppg') || n.includes('pph'))) {
      errores.push('Los formatos PP-G/PP-H no aplican para su programa (Telemática)');
    }
    if (nombres.some((n) => DOCUMENTOS_NO_TELEMATICA.some((d) => n.includes(d)))) {
      errores.push(
        'Los documentos obligatorios (PM-FO-4-FOR-27, Autorización, Comprobante, Trabajo de grado) no aplican para su programa (Telemática)'
      );
    }

    const faltantes = nombres.some((n) => n.includes('cedula'))
      ? []
      : ['Fotocopia de cédula (obligatoria para Telemática)'];

    return [...faltantes, ...errores];
  }

  /** Se suben los documentos sin asociarlos y el backend los asocia al crear la solicitud. */
  protected crearSolicitud(usuario: UsuarioSesion, archivos: Archivo[]) {
    return this.pazSalvoService.crearSolicitudConFormulario(usuario.id_usuario, archivos, this.datosSolicitud(usuario));
  }

  /** Datos del formulario en el formato que espera el backend. */
  private datosSolicitud(usuario: UsuarioSesion): DatosSolicitudPazSalvo {
    const formValue = this.solicitudForm.value;
    const fecha =
      formValue.fecha_terminacion_plan instanceof Date
        ? formValue.fecha_terminacion_plan
        : new Date(formValue.fecha_terminacion_plan ?? '');

    const nombreCompleto = usuario.nombre_completo?.trim() || 'Usuario';

    const datos: DatosSolicitudPazSalvo = {
      nombre_solicitud: `Solicitud Paz y Salvo - ${nombreCompleto}`,
      fecha_registro_solicitud: fecha.toISOString().split('T')[0],
    };

    if (this.requiereTrabajoGrado) {
      const titulo = formValue.titulo_trabajo_grado?.trim();
      const director = formValue.director_trabajo_grado?.trim();
      if (titulo) datos.titulo_trabajo_grado = titulo;
      if (director) datos.director_trabajo_grado = director;
    }
    return datos;
  }

  protected override despuesDeEnviar(): void {
    this.solicitudForm.reset({
      fecha_terminacion_plan: null,
      titulo_trabajo_grado: '',
      director_trabajo_grado: '',
    });
    super.despuesDeEnviar();
  }

  /** Los comentarios de paz y salvo los arma el backend (documentos, rechazo y mensaje). */
  override verComentarios(solicitudId: number): void {
    const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);
    if (!solicitudCompleta) {
      this.snackbar.error('No se encontró la información de la solicitud');
      return;
    }

    this.pazSalvoService
      .obtenerComentarios(solicitudCompleta.id_solicitud)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comentarios) =>
          this.abrirComentarios({
            titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
            documentos:
              comentarios.documentosConComentarios?.map((doc) => ({
                nombre: doc.nombre,
                comentario: doc.comentario,
              })) || [],
            comentarioRechazo: comentarios.comentarioRechazo || null,
            mensaje: comentarios.mensaje || undefined,
          }),
        error: () => this.snackbar.error('Error al cargar los comentarios'),
      });
  }

  /**
   * Descarga el oficio de la solicitud. El servicio toma el nombre del encabezado
   * Content-Disposition o, si no viene, del primer oficio de la solicitud.
   */
  descargarOficio(idSolicitud: number, nombreArchivo: string): void {
    this.pazSalvoService
      .descargarOficioPorSolicitud(idSolicitud)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          descargarBlob(blob, blob.filename || nombreArchivo || `oficio_${idSolicitud}.pdf`);
          this.snackbar.exito('Oficio descargado exitosamente');
        },
        error: (err) => {
          if (err.status === 404) {
            this.snackbar.advertencia('No hay oficios disponibles para esta solicitud');
          } else {
            this.snackbar.error(
              'Error al descargar el oficio: ' + (err.error?.message || err.message || 'Error desconocido')
            );
          }
        },
      });
  }
}
