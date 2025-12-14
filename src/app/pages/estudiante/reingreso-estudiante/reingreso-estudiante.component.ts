import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { Archivo, SolicitudReingresoDTORespuesta, DocumentosDTORespuesta, SolicitudReingresoDTOPeticion, UsuarioDTOPeticion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "../../../shared/components/required-docs/required-docs.component";
import { ComentariosDialogComponent, ComentariosDialogData } from "../../../shared/components/comentarios-dialog/comentarios-dialog.component";
import { PeriodoActualDisplayComponent } from "../../../shared/components/periodo-actual-display/periodo-actual-display.component";

import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { MatDialog } from '@angular/material/dialog';

import { Solicitud } from '../../../core/models/procesos.model';

@Component({
  selector: 'app-reingreso-estudiante',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent,
    PeriodoActualDisplayComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['./reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  documentosRequeridos = [
    { label: 'PM-FO-4-FOR-17 Solicitud de Reingreso V2', obligatorio: true },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Documento de identidad', obligatorio: true },
    { label: 'Carta de motivación', obligatorio: false }
  ];

  private readonly nombresDocumentosRequeridos = this.documentosRequeridos.map(doc => doc.label.toLowerCase().trim());

  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudReingresoDTORespuesta[] = [];

  usuario: any = null;

  constructor(
    private reingresoService: ReingresoEstudianteService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      // Usuario cargado desde localStorage
    } else {
      console.warn('No se encontró usuario en localStorage');
    }

    // Listar solicitudes existentes al cargar el componente
    this.listarSolicitudes();

    // Verificar funcionalidad de comentarios (para debugging)
    setTimeout(() => {
      this.verificarFuncionalidadComentarios();
    }, 2000);
  }

  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
  }

  puedeEnviar(): boolean {
    return this.archivosActuales.length > 0 && !!this.usuario;
  }

  /**
   * Muestra un mensaje bonito usando SnackBar
   */
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const config = {
      duration: tipo === 'success' ? 4000 : 6000,
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${tipo}`]
    };

    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  onSolicitudEnviada() {
    if (!this.usuario) {
      console.error('No se puede enviar solicitud: usuario no encontrado.');
      return;
    }

    if (!this.fileUploadComponent) {
      console.error('No se puede acceder al componente de archivos.');
      return;
    }

    // Iniciando proceso de envío de solicitud

    // Paso 1: Subir archivos al backend
    this.fileUploadComponent.subirArchivosPendientes().subscribe({
      next: (archivosSubidos) => {
        // Archivos subidos correctamente

        // Paso 2: Crear la solicitud con los archivos ya subidos
        const solicitud: SolicitudReingresoDTOPeticion = {
          nombre_solicitud: `Solicitud_reingreso_${this.usuario.nombre_completo}`,
          fecha_registro_solicitud: new Date(),
          objUsuario: {
            id_usuario: this.usuario.id_usuario,
            nombre_completo: this.usuario.nombre_completo,
            codigo: this.usuario.codigo,
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

        // Creando solicitud con archivos

        this.reingresoService.crearSolicitud(solicitud).subscribe({
          next: (resp) => {
            // Solicitud creada en backend
            this.listarSolicitudes();

            // Resetear el file upload
            this.resetFileUpload = true;
            setTimeout(() => this.resetFileUpload = false, 0);

            this.mostrarMensaje('¡Solicitud de reingreso enviada correctamente!', 'success');
          },
          error: (err) => {
            console.error('Error al crear solicitud:', err);
            if (err.status === 400) {
              this.mostrarMensaje('Error de validación: revisa los datos de la solicitud', 'warning');
            }
            if (err.status === 401) {
              this.mostrarMensaje('Sesión expirada. Por favor, inicia sesión de nuevo.', 'warning');
            }
          }
        });
      },
      error: (err) => {
        console.error('Error al subir archivos:', err);
        this.mostrarMensaje('Error al subir archivos. Por favor, inténtalo de nuevo.', 'error');

        // Resetear el estado de carga del componente de subida
        if (this.fileUploadComponent) {
          this.fileUploadComponent.resetearEstadoCarga();
        }
      }
    });
  }

  listarSolicitudes() {
    if (!this.usuario) {
      console.error("Usuario no encontrado en localStorage.");
      return;
    }

    // Usuario encontrado
    // Rol
    // ID Usuario

    this.reingresoService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario).subscribe({
      next: (data) => {
        // Respuesta del backend (raw)

        if (!data || !Array.isArray(data)) {
          console.warn('La respuesta no es un array válido');
          this.solicitudes = [];
          this.solicitudesCompletas = [];
          return;
        }

        // Guardar las solicitudes completas para usar esSeleccionado y comentarios
        this.solicitudesCompletas = data;

        this.solicitudes = data.map((sol: any) => {
          // Procesando solicitud

          const estados = sol.estado_actual || sol.estadosSolicitud || [];
          const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

          const rutaArchivo = sol.documentos?.length > 0 ? sol.documentos[0].ruta : '';

          const solicitudTransformada = {
            id: sol.id_solicitud,
            nombre: sol.nombre_solicitud,
            fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
            estado: ultimoEstado?.estado_actual || 'Pendiente',
            rutaArchivo,
            comentarios: ultimoEstado?.comentarios || '',
            esSeleccionado: sol.esSeleccionado || false
          };

          // Solicitud transformada
          return solicitudTransformada;
        });

        // Solicitudes cargadas (transformadas)
      },
      error: (err) => {
        console.error('Error al listar solicitudes', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Error completo:', err);
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
      this.mostrarMensaje('No se encontró la información de la solicitud', 'error');
      return;
    }

    if (!solicitudCompleta.documentos || solicitudCompleta.documentos.length === 0) {
      this.mostrarMensaje('No hay documentos asociados a esta solicitud', 'warning');
      return;
    }

    const dialogRef = this.dialog.open(ComentariosDialogComponent, {
      width: '700px',
      data: <ComentariosDialogData>{
        titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
        documentos: solicitudCompleta.documentos,
        comentarioRechazo: null
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Diálogo de comentarios cerrado');
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
    console.log('📥 Descargando oficio:', idOficio);

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
    this.reingresoService.obtenerOficios(idSolicitud).subscribe({
      next: (oficios) => {
        console.log('📄 Oficios obtenidos:', oficios);

        if (!oficios || oficios.length === 0) {
          this.mostrarMensaje('No hay oficios disponibles para esta solicitud', 'warning');
          return;
        }

        const oficioSeleccionado = this.seleccionarOficioReciente(oficios, idSolicitud);
        const candidatos = this.construirCandidatosDescarga(oficioSeleccionado, idSolicitud);

        if (candidatos.length === 0) {
          console.warn('⚠️ No se encontraron nombres válidos para el oficio, se usará el flujo antiguo.');
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
        console.error('❌ Error al obtener oficios:', err);

        // Si no se pueden obtener oficios, intentar con nombres comunes
        this.intentarDescargaConNombresComunes(idSolicitud, nombreArchivo);
      }
    });
  }

  /**
   * Descargar archivo por nombre usando el endpoint de archivos
   */
  private descargarArchivoPorNombre(nombreArchivo: string, nombreDescarga: string, idSolicitud?: number): void {
    console.log('📁 Descargando archivo por nombre:', nombreArchivo);

    // Usar el endpoint de solicitudes de reingreso
    const url = `${environment.apiUrl}/solicitudes-reingreso/descargarOficio/${idSolicitud || 1}`;

    // Crear headers con autorización
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(url, {
      headers: headers,
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        console.log('✅ Archivo descargado exitosamente');

        // Obtener el nombre del archivo desde los headers de la respuesta
        const contentDisposition = response.headers.get('Content-Disposition');
        let nombreArchivoDescarga = nombreDescarga || nombreArchivo;

        console.log('🔍 Content-Disposition header:', contentDisposition);

        if (contentDisposition) {
          // Intentar diferentes patrones para extraer el nombre del archivo
          let matches = contentDisposition.match(/filename="(.+)"/);
          if (!matches) {
            matches = contentDisposition.match(/filename=([^;]+)/);
          }
          if (!matches) {
            matches = contentDisposition.match(/filename\*=UTF-8''(.+)/);
          }

          if (matches && matches[1]) {
            nombreArchivoDescarga = decodeURIComponent(matches[1]);
            console.log('📁 Nombre del archivo desde headers:', nombreArchivoDescarga);
          } else {
            console.log('⚠️ No se pudo extraer el nombre del archivo del header Content-Disposition');
          }
        } else {
          console.log('⚠️ No se encontró el header Content-Disposition');
          // Usar el nombre del archivo que viene del método obtenerOficios
          nombreArchivoDescarga = nombreArchivo;
          console.log('📁 Usando nombre del archivo del método obtenerOficios:', nombreArchivoDescarga);
        }

        // Crear URL temporal y descargar
        const blob = response.body!;

        // Logging para diagnosticar el problema
        console.log('📊 Tipo de contenido:', response.headers.get('Content-Type'));
        console.log('📊 Tamaño del blob:', blob.size);
        console.log('📊 Tipo del blob:', blob.type);
        console.log('📊 Nombre de descarga:', nombreArchivoDescarga);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivoDescarga;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.mostrarMensaje('Oficio descargado exitosamente', 'success');
      },
      error: (err) => {
        console.error('❌ Error al descargar archivo:', err);
        this.mostrarMensaje('Error al descargar archivo: ' + (err.error?.message || err.message || 'Error desconocido'), 'error');
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
    console.log('📄 Descargando documento de resolución:', documento);

    this.reingresoService.descargarArchivo(documento.nombre).subscribe({
      next: (blob: Blob) => {
        this.descargarBlob(blob, nombreDescarga);
        this.mostrarMensaje('Oficio descargado exitosamente', 'success');
      },
      error: (err) => {
        console.error('❌ Error al descargar documento de resolución por nombre:', err);
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
    console.log('📥 Intentando descargar oficio por ID:', idOficio);
    this.reingresoService.descargarOficio(idOficio).subscribe({
      next: (blob: Blob) => {
        const nombreFinal = nombreArchivo || `oficio_reingreso_${idOficio}.pdf`;
        this.descargarBlob(blob, nombreFinal);
        this.mostrarMensaje('Oficio descargado exitosamente', 'success');
      },
      error: (err) => {
        console.error(`❌ Error al descargar oficio por ID ${idOficio}:`, err);
        onError();
      }
    });
  }

  private descargarOficioPorCandidatos(candidatos: string[], nombreDescarga: string, idSolicitud: number, indice: number = 0): void {
    if (indice >= candidatos.length) {
      console.warn('⚠️ Ninguno de los nombres candidatos funcionó, usando flujo alternativo.');
      this.descargarArchivoPorNombre(nombreDescarga, nombreDescarga, idSolicitud);
      return;
    }

    const nombreActual = candidatos[indice];
    console.log(`📥 Intentando descargar oficio usando nombre: ${nombreActual}`);

    this.reingresoService.descargarArchivo(nombreActual).subscribe({
      next: (blob: Blob) => {
        const nombreFinal = nombreDescarga || this.extraerNombreDesdeRuta(nombreActual) || `oficio_${idSolicitud}.pdf`;
        this.descargarBlob(blob, nombreFinal);
        this.mostrarMensaje('Oficio descargado exitosamente', 'success');
      },
      error: (err) => {
        console.error(`❌ Error al descargar usando "${nombreActual}". Probando siguiente opción...`, err);
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

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Intentar descarga con nombres comunes
   */
  private intentarDescargaConNombresComunes(idSolicitud: number, nombreArchivo: string): void {
    console.log('🔄 Intentando descarga con nombres comunes...');

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
      this.mostrarMensaje('No se encontró el archivo con los nombres probados', 'warning');
      return;
    }

    const nombre = nombres[index];
    console.log(`🧪 Probando nombre ${index + 1}/${nombres.length}: "${nombre}"`);

    this.descargarArchivoPorNombre(nombre, nombreDescarga, idSolicitud);
  }
}
