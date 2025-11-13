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
    RequestStatusTableComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['./reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  documentosRequeridos = [
    { label: 'Solicitud de reingreso', obligatorio: true },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Documento de identidad', obligatorio: true },
    { label: 'Carta de motivación', obligatorio: false }
  ];

  archivosExclusivos: string[] = ['Documento A', 'Documento B'];

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
      console.log('👤 Usuario cargado desde localStorage:', this.usuario);
    } else {
      console.warn('⚠️ No se encontró usuario en localStorage');
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
      console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
      return;
    }

    if (!this.fileUploadComponent) {
      console.error('❌ No se puede acceder al componente de archivos.');
      return;
    }

    console.log('📤 Iniciando proceso de envío de solicitud...');

    // Paso 1: Subir archivos al backend
    this.fileUploadComponent.subirArchivosPendientes().subscribe({
      next: (archivosSubidos) => {
        console.log('✅ Archivos subidos correctamente:', archivosSubidos);

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
            // ✅ FIX: Agregar id_rol e id_programa como campos requeridos por el backend
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

        console.log('📋 Creando solicitud con archivos:', solicitud);
        console.log('👤 Usuario completo:', this.usuario);

        this.reingresoService.crearSolicitud(solicitud).subscribe({
          next: (resp) => {
            console.log('✅ Solicitud creada en backend:', resp);
            this.listarSolicitudes();

            // Resetear el file upload
            this.resetFileUpload = true;
            setTimeout(() => this.resetFileUpload = false, 0);

            this.mostrarMensaje('🎉 ¡Solicitud de reingreso enviada correctamente!', 'success');
          },
          error: (err) => {
            console.error('❌ Error al crear solicitud:', err);
            if (err.status === 400) {
              this.mostrarMensaje('⚠️ Error de validación: revisa los datos de la solicitud', 'warning');
            }
            if (err.status === 401) {
              this.mostrarMensaje('⚠️ Sesión expirada. Por favor, inicia sesión de nuevo.', 'warning');
            }
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al subir archivos:', err);
        this.mostrarMensaje('❌ Error al subir archivos. Por favor, inténtalo de nuevo.', 'error');

        // Resetear el estado de carga del componente de subida
        if (this.fileUploadComponent) {
          this.fileUploadComponent.resetearEstadoCarga();
        }
      }
    });
  }

  listarSolicitudes() {
    if (!this.usuario) {
      console.error("❌ Usuario no encontrado en localStorage.");
      return;
    }

    console.log('🔍 Usuario encontrado:', this.usuario);
    console.log('🔍 Rol:', this.usuario.rol.nombre);
    console.log('🔍 ID Usuario:', this.usuario.id_usuario);

    this.reingresoService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario).subscribe({
      next: (data) => {
        console.log('📡 Respuesta del backend (raw):', data);
        console.log('📡 Tipo de respuesta:', typeof data);
        console.log('📡 Es array:', Array.isArray(data));
        console.log('📡 Longitud:', data?.length);

        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ La respuesta no es un array válido');
          this.solicitudes = [];
          this.solicitudesCompletas = [];
          return;
        }

        // Guardar las solicitudes completas para usar esSeleccionado y comentarios
        this.solicitudesCompletas = data;

        this.solicitudes = data.map((sol: any) => {
          console.log('🔍 Procesando solicitud:', sol);

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

          console.log('✅ Solicitud transformada:', solicitudTransformada);
          return solicitudTransformada;
        });

        console.log('📋 Solicitudes cargadas (transformadas):', this.solicitudes);
        console.log('📋 Solicitudes completas:', this.solicitudesCompletas);
      },
      error: (err) => {
        console.error('❌ Error al listar solicitudes', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ Error completo:', err);
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
    console.log('🔍 Verificando funcionalidad de comentarios...');
    console.log('📋 Solicitudes completas:', this.solicitudesCompletas);
    console.log('📋 Solicitudes transformadas:', this.solicitudes);
  }

  /**
   * Descargar oficio
   */
  descargarOficio(idOficio: number, nombreArchivo: string): void {
    console.log('📥 Descargando oficio:', idOficio);

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

        // Tomar el primer oficio disponible
        const oficio = oficios[0];
        const nombreArchivoOficio = oficio.nombre || oficio.nombreArchivo || `oficio_${idSolicitud}.pdf`;

        // Intentar descargar usando el endpoint de archivos
        this.descargarArchivoPorNombre(nombreArchivoOficio, nombreArchivo, idSolicitud);
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
