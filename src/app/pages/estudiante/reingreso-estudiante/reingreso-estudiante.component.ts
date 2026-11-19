import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { descargarBlob } from '@core/utils/download.util';

import { Archivo, SolicitudReingresoDTORespuesta, SolicitudReingresoDTOPeticion } from '@core/models/procesos.model';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { Documento, RequiredDocsComponent } from '@shared/components/required-docs/required-docs.component';

import { ReingresoEstudianteService } from '@core/services/reingreso-estudiante.service';
import { FormatosInstitucionalesService } from '@core/services/formatos-institucionales.service';
import { LoggerService } from '@core/services/logger.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { getPeriodoActual } from '@core/utils/periodo.utils';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { usuarioParaSolicitud } from '@core/utils/usuario-solicitud.util';
import { SolicitudEstudianteBase } from '../solicitud-estudiante.base';
import { documentoDeResolucion, nombreDesdeRuta } from './resolucion-reingreso';

@Component({
  selector: 'app-reingreso-estudiante',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent,
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['../solicitud-estudiante-comun.css', './reingreso-estudiante.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReingresoEstudianteComponent extends SolicitudEstudianteBase<SolicitudReingresoDTORespuesta> {
  private reingresoService = inject(ReingresoEstudianteService);
  private formatosService = inject(FormatosInstitucionalesService);
  private logger = inject(LoggerService);
  private periodosService = inject(PeriodosAcademicosService);

  documentosRequeridos: Documento[] = [
    { label: 'PM-FO-4-FOR-17 Solicitud de Reingreso V2', obligatorio: true, formatoDisponibleUrl: '' },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Documento de identidad', obligatorio: true },
    { label: 'Carta de motivación', obligatorio: true },
  ];

  protected override palabrasClaveDocumentos = {
    pmfo4for17: ['pmfo4for17', 'pm-fo-4-for-17', 'solicitud', 'reingreso', 'reingreso v2'],
    certificado: ['certificado', 'notas', 'calificaciones', 'notas academicas'],
    documento: ['documento', 'identidad', 'cedula', 'cédula', 'tarjeta', 'identidad'],
    carta: ['carta', 'motivacion', 'motivación', 'motivo'],
  };

  protected readonly mensajeExito = '¡Solicitud de reingreso enviada correctamente!';

  private readonly nombresDocumentosRequeridos = this.documentosRequeridos.map((doc) => doc.label);

  protected override alIniciar(): void {
    const reingreso = this.formatosService.getReingreso();
    if (reingreso) {
      this.documentosRequeridos[0].label = reingreso.nombre;
      this.documentosRequeridos[0].formatoDisponibleUrl = reingreso.url;
    }
  }

  protected listar(usuario: UsuarioSesion) {
    return this.reingresoService.listarSolicitudesPorRol('ESTUDIANTE', usuario.id_usuario);
  }

  protected crearSolicitud(usuario: UsuarioSesion, archivos: Archivo[]) {
    const nombre = usuario.nombre_completo?.trim() || 'Usuario';
    const solicitud: SolicitudReingresoDTOPeticion = {
      nombre_solicitud: `Solicitud Reingreso - ${nombre}`,
      fecha_registro_solicitud: new Date(),
      periodo_academico: this.periodosService.getPeriodoActualValue()?.valor || getPeriodoActual(),
      fecha_ceremonia: null,
      objUsuario: usuarioParaSolicitud(usuario),
      documentos: archivos.map((archivo) => ({
        nombre: archivo.nombre,
        fecha_documento: new Date(),
        esValido: true,
        comentario: archivo.comentario || undefined,
      })),
    };
    return this.reingresoService.crearSolicitud(solicitud);
  }

  /**
   * Primero la resolución que subió secretaría, tomada de los documentos de la solicitud; si no hay
   * o no se puede bajar por su nombre, el oficio que da el backend (como en homologación).
   */
  descargarOficio(idSolicitud: number, nombreArchivo: string): void {
    const resolucion = documentoDeResolucion(
      this.obtenerSolicitudCompleta(idSolicitud)?.documentos,
      this.nombresDocumentosRequeridos
    );
    const respaldo = nombreArchivo || `oficio_reingreso_${idSolicitud}.pdf`;
    if (!resolucion) {
      this.descargarOficioDelProceso(this.reingresoService, idSolicitud, respaldo);
      return;
    }

    const nombreDescarga = nombreDesdeRuta(resolucion.nombre || resolucion.ruta_documento) || 'oficio_reingreso.pdf';
    this.reingresoService
      .descargarArchivo(resolucion.nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          descargarBlob(blob, nombreDescarga);
          this.snackbar.exito('Oficio descargado exitosamente');
        },
        error: (err) => {
          this.logger.warn('No se pudo bajar la resolución por su nombre; se pide el oficio al backend', err);
          this.descargarOficioDelProceso(this.reingresoService, idSolicitud, nombreDescarga);
        },
      });
  }
}
