import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { descargarBlob, nombreDeContentDisposition } from '@core/utils/download.util';

import { Archivo, SolicitudReingresoDTORespuesta, DocumentosDTORespuesta, SolicitudReingresoDTOPeticion } from '@core/models/procesos.model';
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
import { OficioRespuesta } from '@core/services/base/solicitudes-base.service';
import { SolicitudEstudianteBase } from '../solicitud-estudiante.base';

@Component({
  selector: 'app-reingreso-estudiante',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['../solicitud-estudiante-comun.css', './reingreso-estudiante.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    { label: 'Carta de motivación', obligatorio: true }
  ];

  protected override palabrasClaveDocumentos = {
    'pmfo4for17': ['pmfo4for17', 'pm-fo-4-for-17', 'solicitud', 'reingreso', 'reingreso v2'],
    'certificado': ['certificado', 'notas', 'calificaciones', 'notas academicas'],
    'documento': ['documento', 'identidad', 'cedula', 'cédula', 'tarjeta', 'identidad'],
    'carta': ['carta', 'motivacion', 'motivación', 'motivo']
  };

  protected readonly mensajeExito = '¡Solicitud de reingreso enviada correctamente!';

  private readonly nombresDocumentosRequeridos = this.documentosRequeridos.map(doc => doc.label.toLowerCase().trim());

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
      documentos: archivos.map(archivo => ({
        nombre: archivo.nombre,
        fecha_documento: new Date(),
        esValido: true,
        comentario: archivo.comentario || undefined
      }))
    };
    return this.reingresoService.crearSolicitud(solicitud);
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  /** El backend no manda fecha de los oficios: se prefiere el primero que parezca generado. */
  private seleccionarOficioReciente(oficios: OficioRespuesta[], idSolicitud: number): OficioRespuesta | null {
    if (!oficios || oficios.length === 0) {
      return null;
    }
    return oficios.find(oficio => this.esOficioGenerado(oficio, idSolicitud)) || oficios[0];
  }

  private parsearFechaDocumento(fecha: Date | string | undefined): number {
    if (!fecha) {
      return 0;
    }

    if (fecha instanceof Date) {
      return fecha.getTime();
    }

    const parsed = Date.parse(fecha);
    return isNaN(parsed) ? 0 : parsed;
  }

  private construirCandidatosDescarga(oficio: OficioRespuesta | null, idSolicitud: number): string[] {
    const candidatos = new Set<string>();

    if (!oficio) {
      return [];
    }

    if (typeof oficio.id === 'number') {
      candidatos.add(`oficio_${oficio.id}.pdf`);
    }

    candidatos.add(`oficio_${idSolicitud}.pdf`);
    candidatos.add(`resolucion_${idSolicitud}.pdf`);
    candidatos.add(`resolucion_reingreso_${idSolicitud}.pdf`);

    [oficio.ruta, oficio.nombreArchivo, oficio.nombre].forEach(valor => {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  private esOficioGenerado(oficio: OficioRespuesta, idSolicitud: number): boolean {
    const patrones = /(resoluci[oó]n|oficio)/i;
    const camposTexto = [oficio.nombre, oficio.nombreArchivo, oficio.ruta];
    return oficio.id === idSolicitud ||
      camposTexto.some(valor => typeof valor === 'string' && (patrones.test(valor) || valor.includes(`${idSolicitud}`)));
  }

  private obtenerIdOficio(oficio: OficioRespuesta | null): number | null {
    return typeof oficio?.id === 'number' && !isNaN(oficio.id) ? oficio.id : null;
  }

  private descargarOficioPorId(idOficio: number, nombreArchivo: string, onError: () => void): void {
    this.logger.debug('Intentando descargar oficio por ID', { idOficio, nombreArchivo });
    this.reingresoService.descargarOficio(idOficio)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    const codigoUsuario = usuario?.codigo || 'SIN_CODIGO';
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
