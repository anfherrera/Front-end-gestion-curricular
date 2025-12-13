import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { descargarBlob } from '../../../core/utils/download.util';
import { Subject, takeUntil } from 'rxjs'; // Agregar para limpieza de suscripciones

import { Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "../../../shared/components/required-docs/required-docs.component";
import { ComentariosDialogComponent, ComentariosDialogData } from "../../../shared/components/comentarios-dialog/comentarios-dialog.component";

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    RequestStatusTableComponent,
    FileUploadComponent,
    RequiredDocsComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit, OnDestroy {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent

  // Subject para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudHomologacionDTORespuesta[] = [];
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  usuario: any = null;

  SolicitudStatusEnum = SolicitudStatusEnum;

  documentosRequeridos = [
    { label: 'Formato PM-FO-4-FOR-27 (Hoja de vida académica).pdf', obligatorio: true },
    { label: 'Autorización para publicar y permitir la consulta y uso de obras en el Repositorio Institucional.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado con sus anexos (PDF).pdf', obligatorio: true },
    // Formatos según modalidad de trabajo de grado (requeridos según corresponda)
    // Para modalidad TRABAJO DE INVESTIGACIÓN: TI-G y TI-H
    { label: 'Formato TI-G (Acta sustentación TRABAJO DE INVESTIGACIÓN).pdf', obligatorio: false },
    { label: 'Formato TI-H (Constancia director y jurados TRABAJO DE INVESTIGACIÓN).pdf', obligatorio: false },
    // Para modalidad PRÁCTICA PROFESIONAL: PP-G y PP-H (NOTA: PP-H es diferente a PPH)
    { label: 'Formato PP-G (Acta sustentación PRÁCTICA PROFESIONAL).pdf', obligatorio: false },
    { label: 'Formato PP-H (Constancia director y jurados PRÁCTICA PROFESIONAL).pdf', obligatorio: false }
  ];

  // Archivos exclusivos: Para programas de Sistemas, Electrónica y Automática (solo uno de estos dos)
  // IMPORTANTE: Estos son DIFERENTES a PP-H (que está arriba en documentosRequeridos). 
  // - PP-H (con guion) = Constancia para modalidad PRÁCTICA PROFESIONAL (va con PP-G)
  // - PPH (sin guion) = Acta de sustentación para programas Sistemas, Electrónica, Automática
  // Estos formatos también se suben a SIMCA Web, pero deben adjuntarse aquí también
  archivosExclusivos: string[] = [
    'Formato PPH (Acta sustentación - Sistemas, Electrónica, Automática).pdf',
    'Formato TIH (Acta sustentación - Sistemas, Electrónica, Automática).pdf'
  ];

  // Archivos opcionales
  optionalFiles: string[] = [
    'Fotocopia de cédula (Solo para Tecnología en Telemática).pdf'
  ];

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificacionesService: NotificacionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
    } else {
    }

    // Listar solicitudes existentes al cargar el componente
    this.listarSolicitudes();
    
    // Verificar funcionalidad de comentarios (para debugging)
    setTimeout(() => {
      this.verificarFuncionalidadComentarios();
    }, 2000);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
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

listarSolicitudes() {
  if (!this.usuario) {
    console.error("Usuario no encontrado en localStorage.");
    return;
  }
  // CORREGIDO: Usar el nuevo método con rol e idUsuario
  const rol = 'ESTUDIANTE';
  const idUsuario = this.usuario.id_usuario;
  this.pazSalvoService.listarSolicitudesPorRol(rol, idUsuario)
    .pipe(takeUntil(this.destroy$)) // Auto-unsubscribe
    .subscribe({
    next: (data) => {
      if (!data || !Array.isArray(data)) {
        this.solicitudes = [];
        this.solicitudesCompletas = [];
        return;
      }

      // Guardar las solicitudes completas para usar esSeleccionado y comentarios
      this.solicitudesCompletas = data;

      // Log para debugging - verificar estructura de datos
      if (data.length > 0) {
        if (data[0].estadosSolicitud) {
          data[0].estadosSolicitud.forEach((estado: any, index: number) => {
          });
        }
      }

      this.solicitudes = data.map((sol: any) => {
        const estados = sol.estado_actual || sol.estadosSolicitud || [];
        const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

        // Buscar específicamente oficios PDF (subidos por secretaria)
        const oficiosPDF = sol.documentos?.filter((doc: any) => {
          if (!doc.nombre) return false;
          const nombre = doc.nombre.toLowerCase();
          const esPDF = nombre.endsWith('.pdf');
          const esOficio = nombre.includes('oficio') || 
                          nombre.includes('resolucion') || 
                          nombre.includes('paz') ||
                          nombre.includes('salvo') ||
                          nombre.includes('aprobacion');
          return esPDF && esOficio;
        }) || [];
        
        const rutaArchivo = oficiosPDF.length > 0 ? oficiosPDF[0].nombre : '';
        const solicitudTransformada = {
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: ultimoEstado?.estado_actual || 'Pendiente',
          rutaArchivo,
          comentarios: ultimoEstado?.comentarios || '',
          esSeleccionado: sol.esSeleccionado || false // Usar el campo esSeleccionado
        };
        return solicitudTransformada;
      });

    },
    error: (err) => {
      console.error('Error al listar solicitudes', err);
      console.error('Status:', err.status);
      console.error('Message:', err.message);
      console.error('Error completo:', err);
    }
  });
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
    // Paso 1: Subir documentos SIN asociar a solicitud
    this.fileUploadComponent.subirArchivosPendientes()
      .pipe(takeUntil(this.destroy$)) // Auto-unsubscribe
      .subscribe({
      next: (archivosSubidos) => {

        // Paso 2: Crear la solicitud (los documentos se asocian automáticamente)
        const solicitud = {
          nombre_solicitud: `Solicitud_paz_salvo_${this.usuario.nombre_completo}`,
          fecha_registro_solicitud: new Date().toISOString(),
          objUsuario: {
            id_usuario: this.usuario.id_usuario,
            nombre_completo: this.usuario.nombre_completo,
            codigo: this.usuario.codigo,
            correo: this.usuario.correo,
            objPrograma: this.usuario.objPrograma
          },
          archivos: archivosSubidos // Los documentos se asociarán automáticamente
        };


        this.pazSalvoService.sendRequest(this.usuario.id_usuario, archivosSubidos)
          .pipe(takeUntil(this.destroy$)) // Auto-unsubscribe
          .subscribe({
          next: (resp) => {
            this.listarSolicitudes();

            // Actualizar notificaciones después de crear la solicitud
            const usuario = this.authService.getUsuario();
            if (usuario?.id_usuario) {
              this.notificacionesService.actualizarNotificaciones(usuario.id_usuario);
            }

            // FIX: Resetear el file upload en el siguiente ciclo de detección para evitar NG0100
            setTimeout(() => {
              this.resetFileUpload = true;
              this.cdr.detectChanges(); // Forzar detección de cambios
              setTimeout(() => {
                this.resetFileUpload = false;
                this.cdr.detectChanges(); // Forzar detección de cambios
              }, 0);
            }, 0);

            this.mostrarMensaje('¡Solicitud de paz y salvo enviada correctamente! Los documentos se asociaron automáticamente.', 'success');
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
        console.error('Error al subir documentos:', err);
        this.mostrarMensaje('Error al subir documentos. Por favor, inténtalo de nuevo.', 'error');
        
        // Resetear el estado de carga del componente de subida
        if (this.fileUploadComponent) {
          this.fileUploadComponent.resetearEstadoCarga();
        }
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
obtenerSolicitudCompleta(idSolicitud: number): SolicitudHomologacionDTORespuesta | undefined {
  return this.solicitudesCompletas.find(sol => sol.id_solicitud === idSolicitud);
}

/**
 * Obtener el comentario de rechazo del último estado
 */
obtenerComentarioRechazo(solicitud: SolicitudHomologacionDTORespuesta): string | null {
  if (!solicitud.estadosSolicitud || solicitud.estadosSolicitud.length === 0) {
    return null;
  }

  // Buscar el último estado que sea RECHAZADA
  const estadosRechazados = solicitud.estadosSolicitud.filter(estado => 
    estado.estado_actual === 'RECHAZADA' || estado.estado_actual === 'Rechazada'
  );
  if (estadosRechazados.length === 0) {
    return null;
  }

  // Obtener el último estado de rechazo
  const ultimoEstadoRechazo = estadosRechazados[estadosRechazados.length - 1];
  return ultimoEstadoRechazo.comentario || null;
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

  // Obtener el comentario de rechazo del último estado
  const comentarioRechazo = this.obtenerComentarioRechazo(solicitudCompleta);
  const dialogRef = this.dialog.open(ComentariosDialogComponent, {
    width: '700px',
    data: <ComentariosDialogData>{
      titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
      documentos: solicitudCompleta.documentos,
      comentarioRechazo: comentarioRechazo
    }
  });

  dialogRef.afterClosed().subscribe(() => {
  });
}

/**
 * Verificar si una solicitud tiene comentarios
 */
tieneComentarios(solicitudId: number): boolean {
  const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);
  
  if (!solicitudCompleta || !solicitudCompleta.documentos) {
    return false;
  }

  return solicitudCompleta.documentos.some(doc => 
    doc.comentario && doc.comentario.trim().length > 0
  );
}

/**
 * Método de prueba para verificar el funcionamiento
 */
verificarFuncionalidadComentarios(): void {
  // Buscar solicitudes rechazadas
  const solicitudesRechazadas = this.solicitudes.filter(sol => 
    this.esSolicitudRechazada(sol.estado)
  );
  solicitudesRechazadas.forEach(sol => {
    const tieneComentarios = this.tieneComentarios(sol.id);
  });
}


/**
 * Descargar oficio
 */
descargarOficio(idOficio: number, nombreArchivo: string): void {
  // Usar el mismo flujo que homologación: obtener oficios primero
  this.obtenerOficiosYDescargar(idOficio, nombreArchivo);
}

/**
 * Obtener oficios y descargar
 */
private obtenerOficiosYDescargar(idSolicitud: number, nombreArchivo: string): void {
  this.pazSalvoService.obtenerOficios(idSolicitud).subscribe({
    next: (oficios) => {
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
      console.error('Error al obtener oficios:', err);
      
      // Si no se pueden obtener oficios, intentar con nombres comunes
      this.intentarDescargaConNombresComunes(idSolicitud, nombreArchivo);
    }
  });
}

/**
 * Descargar archivo por nombre usando el endpoint de archivos
 */
private descargarArchivoPorNombre(nombreArchivo: string, nombreDescarga: string, idSolicitud?: number): void {
  const solicitudId = idSolicitud || 1;
  this.pazSalvoService.descargarOficioPorSolicitud(solicitudId).subscribe({
    next: (blob: any) => {
      // Si el backend no envía nombre por headers, intentar obtenerlo desde la lista de oficios
      if (!blob?.filename) {
        this.pazSalvoService.obtenerOficios(solicitudId).subscribe({
          next: (oficios) => {
            const nombreLista = oficios?.[0]?.nombreArchivo || oficios?.[0]?.nombre;
            const nombreArchivoDescarga = nombreLista || nombreDescarga || nombreArchivo || `oficio_${solicitudId}.pdf`;
            descargarBlob(blob, nombreArchivoDescarga);
            this.mostrarMensaje('Oficio descargado exitosamente', 'success');
          },
          error: () => {
            const nombreArchivoDescarga = nombreDescarga || nombreArchivo || `oficio_${solicitudId}.pdf`;
            descargarBlob(blob, nombreArchivoDescarga);
            this.mostrarMensaje('Oficio descargado exitosamente', 'success');
          }
        });
      } else {
        const nombreArchivoDescarga = blob.filename as string;
        descargarBlob(blob, nombreArchivoDescarga);
        this.mostrarMensaje('Oficio descargado exitosamente', 'success');
      }
    },
    error: (err) => {
      console.error('Error al descargar archivo:', err);
      this.mostrarMensaje('Error al descargar archivo: ' + (err.error?.message || err.message || 'Error desconocido'), 'error');
    }
  });
}

/**
 * Intentar descarga con nombres comunes
 */
private intentarDescargaConNombresComunes(idSolicitud: number, nombreArchivo: string): void {
  // Obtener información del usuario para generar nombres
  const usuario = this.usuario;
  const codigoUsuario = usuario?.codigo || usuario?.codigo_estudiante || 'SIN_CODIGO';
  const año = new Date().getFullYear();
  
  // Nombres comunes a probar
  const nombresComunes = [
    `OFICIO_PAZ_SALVO_${codigoUsuario}_${año} (1).pdf`,
    `OFICIO_PAZ_SALVO_${codigoUsuario}_${año}.pdf`,
    `oficio_paz_salvo_${codigoUsuario}_${año}.pdf`,
    `paz_salvo_${codigoUsuario}_${año}.pdf`,
    `oficio_${idSolicitud}.pdf`,
    `paz_salvo_${idSolicitud}.pdf`
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
  this.descargarArchivoPorNombre(nombre, nombreDescarga, idSolicitud);
}


/**
 * Obtener el estado actual de una solicitud
 */
obtenerEstadoActual(solicitud: any): string {
  if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
    const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
    return ultimoEstado.estado_actual;
  }
  return 'Pendiente';
}

/**
 * Mostrar oficios en la UI
 */
private mostrarOficiosEnUI(oficios: any[]): void {
  if (!oficios || oficios.length === 0) {
    this.mostrarMensaje('No hay oficios disponibles', 'info');
    return;
  }
  
  this.mostrarMensaje(`Se encontraron ${oficios.length} oficio(s) disponible(s)`, 'success');
}

}
