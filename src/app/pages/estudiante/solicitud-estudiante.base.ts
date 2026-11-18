import { Directive, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { Archivo } from '@core/models/procesos.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { coincidenPorPalabrasClave, normalizarNombreArchivo } from '@core/utils/texto.util';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { Documento } from '@shared/components/required-docs/required-docs.component';
import { SeguimientoSolicitudesBase, SolicitudDelEstudiante } from './seguimiento-solicitudes.base';

/**
 * Solicitud del estudiante con documentos (paz y salvo, homologación y reingreso): además del
 * seguimiento, la lista de archivos, los documentos que faltan y el envío (subir los archivos y
 * crear la solicitud). Cada página dice cómo crearla (`crearSolicitud`) y el mensaje de éxito.
 */
@Directive()
export abstract class SolicitudEstudianteBase<S extends SolicitudDelEstudiante> extends SeguimientoSolicitudesBase<S> {
  protected readonly notificacionesService = inject(NotificacionesService);

  @ViewChild(FileUploadComponent) fileUploadComponent?: FileUploadComponent;

  abstract documentosRequeridos: Documento[];
  /** Palabras que identifican cada documento, para reconocer archivos con otro nombre. */
  protected palabrasClaveDocumentos: Record<string, string[]> = {};
  protected abstract readonly mensajeExito: string;

  readonly archivosActuales = signal<Archivo[]>([]);
  /** Pulso hacia `[reset]` de app-file-upload para que limpie su lista. */
  readonly resetFileUpload = signal(false);

  /** Crea la solicitud con los archivos ya subidos. */
  protected abstract crearSolicitud(usuario: UsuarioSesion, archivos: Archivo[]): Observable<unknown>;

  abstract descargarOficio(idSolicitud: number, nombreArchivo: string): void;

  onArchivosChange(archivos: Archivo[]): void {
    this.archivosActuales.set(archivos);
  }

  puedeEnviar(): boolean {
    return this.archivosActuales().length > 0 && !!this.usuario;
  }

  /** Documentos obligatorios que no se reconocen entre los archivos subidos. */
  obtenerDocumentosFaltantes(): string[] {
    return this.documentosRequeridos
      .filter(doc => doc.obligatorio && !this.archivoSubido(doc.label))
      .map(doc => doc.label);
  }

  /** Si algún archivo se parece al documento: por nombre (en cualquier sentido) o por palabras clave. */
  protected archivoSubido(nombreDocumento: string): boolean {
    const nombreDoc = normalizarNombreArchivo(nombreDocumento);
    return this.archivosActuales().some(archivo => {
      const nombreArchivo = normalizarNombreArchivo(archivo.nombre);
      return nombreArchivo.includes(nombreDoc) ||
        nombreDoc.includes(nombreArchivo) ||
        coincidenPorPalabrasClave(nombreArchivo, nombreDoc, this.palabrasClaveDocumentos);
    });
  }

  /** 1. Sube los archivos pendientes; 2. crea la solicitud con ellos. */
  onSolicitudEnviada(): void {
    const usuario = this.usuario;
    if (!usuario) {
      this.snackbar.error('Error: Usuario no encontrado. Por favor, inicia sesión nuevamente.');
      return;
    }
    const fileUpload = this.fileUploadComponent;
    if (!fileUpload) {
      this.snackbar.error('Error: No se puede acceder al componente de archivos.');
      return;
    }

    fileUpload.subirArchivosPendientes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: archivosSubidos => this.crearSolicitud(usuario, archivosSubidos)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.despuesDeEnviar(),
            error: err => this.avisarErrorAlCrear(err)
          }),
        error: err => {
          this.snackbar.error(this.esErrorDeValidacion(err)
            ? this.errorHandler.extraerMensajeError(err)
            : 'Error al subir documentos. Por favor, inténtalo de nuevo.');
          fileUpload.resetearEstadoCarga();
        }
      });
  }

  /** Recarga la tabla, avisa a las notificaciones y limpia la lista de archivos. */
  protected despuesDeEnviar(): void {
    this.listarSolicitudes();
    this.notificacionesService.actualizarNotificaciones();
    this.archivosActuales.set([]);
    this.resetFileUpload.set(true);
    setTimeout(() => this.resetFileUpload.set(false), 0);
    this.snackbar.exito(this.mensajeExito);
  }

  private avisarErrorAlCrear(err: unknown): void {
    if (this.esErrorDeValidacion(err)) {
      this.snackbar.advertencia(this.errorHandler.extraerMensajeError(err) || 'Error de validación: revisa los datos de la solicitud');
    } else if ((err as { status?: number })?.status === 401) {
      this.snackbar.advertencia('Sesión expirada. Por favor, inicia sesión de nuevo.');
    } else {
      this.snackbar.error('No se pudo enviar la solicitud. Por favor, inténtalo de nuevo.');
    }
  }

  private esErrorDeValidacion(err: unknown): boolean {
    return (err as { status?: number })?.status === 400;
  }
}
