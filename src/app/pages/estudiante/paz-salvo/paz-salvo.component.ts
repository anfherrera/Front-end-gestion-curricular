import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "../../../shared/components/required-docs/required-docs.component";
import { ComentariosDialogComponent, ComentariosDialogData } from "../../../shared/components/comentarios-dialog/comentarios-dialog.component";

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';

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
export class PazSalvoComponent implements OnInit {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent

  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudHomologacionDTORespuesta[] = [];
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  usuario: any = null;

  SolicitudStatusEnum = SolicitudStatusEnum;

  documentosRequeridos = [
    { label: 'Formato PM-FO-4-FOR-27.pdf', obligatorio: true },
    { label: 'Autorización para publicar.pdf', obligatorio: true },
    { label: 'Formato de hoja de vida académica.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado.pdf', obligatorio: true }
  ];

  archivosExclusivos: string[] = ['Formato TI-G.pdf', 'Formato PP-H.pdf'];

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
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

listarSolicitudes() {
  if (!this.usuario) {
    console.error("❌ Usuario no encontrado en localStorage.");
    return;
  }

  console.log('🔍 Usuario encontrado:', this.usuario);
  console.log('🔍 Rol:', this.usuario.rol?.nombre || 'ESTUDIANTE');
  console.log('🔍 ID Usuario:', this.usuario.id_usuario);

  // ✅ CORREGIDO: Usar el nuevo método con rol e idUsuario
  const rol = 'ESTUDIANTE';
  const idUsuario = this.usuario.id_usuario;
  
  console.log('📡 Llamando a listarSolicitudesPorRol con:', { rol, idUsuario });

  this.pazSalvoService.listarSolicitudesPorRol(rol, idUsuario).subscribe({
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

      // Log para debugging - verificar estructura de datos
      console.log('🔍 Estructura de datos del backend:');
      if (data.length > 0) {
        console.log('📋 Primera solicitud completa:', data[0]);
        if (data[0].estadosSolicitud) {
          console.log('📋 Estados de la primera solicitud:', data[0].estadosSolicitud);
          data[0].estadosSolicitud.forEach((estado: any, index: number) => {
            console.log(`📋 Estado ${index}:`, estado);
          });
        }
      }

      this.solicitudes = data.map((sol: any) => {
        console.log('🔍 Procesando solicitud:', sol);

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
        
        console.log('📄 Documentos de la solicitud:', sol.documentos);
        console.log('📄 Oficios PDF encontrados:', oficiosPDF);
        console.log('📄 Ruta archivo seleccionada:', rutaArchivo);

        const solicitudTransformada = {
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: ultimoEstado?.estado_actual || 'Pendiente',
          rutaArchivo,
          comentarios: ultimoEstado?.comentarios || '',
          esSeleccionado: sol.esSeleccionado || false // Usar el campo esSeleccionado
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




  onSolicitudEnviada() {
    if (!this.usuario) {
      console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
      return;
    }

    if (!this.fileUploadComponent) {
      console.error('❌ No se puede acceder al componente de archivos.');
      return;
    }

    console.log('📤 Iniciando proceso de envío de solicitud con NUEVO FLUJO...');

    // 🆕 NUEVO FLUJO: Paso 1: Subir documentos SIN asociar a solicitud
    this.fileUploadComponent.subirArchivosPendientes().subscribe({
      next: (archivosSubidos) => {
        console.log('✅ Documentos subidos correctamente (sin asociar):', archivosSubidos);

        // 🆕 NUEVO FLUJO: Paso 2: Crear la solicitud (los documentos se asocian automáticamente)
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

        console.log('📋 Creando solicitud (documentos se asocian automáticamente):', solicitud);

        this.pazSalvoService.sendRequest(this.usuario.id_usuario, archivosSubidos).subscribe({
          next: (resp) => {
            console.log('✅ Solicitud creada en backend:', resp);
            this.listarSolicitudes();

            // ✅ FIX: Resetear el file upload en el siguiente ciclo de detección para evitar NG0100
            setTimeout(() => {
              this.resetFileUpload = true;
              this.cdr.detectChanges(); // Forzar detección de cambios
              setTimeout(() => {
                this.resetFileUpload = false;
                this.cdr.detectChanges(); // Forzar detección de cambios
              }, 0);
            }, 0);

            this.mostrarMensaje('🎉 ¡Solicitud de paz y salvo enviada correctamente! Los documentos se asociaron automáticamente.', 'success');
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
        console.error('❌ Error al subir documentos:', err);
        this.mostrarMensaje('❌ Error al subir documentos. Por favor, inténtalo de nuevo.', 'error');
        
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
  console.log('🔍 Obteniendo comentario de rechazo para solicitud:', solicitud.id_solicitud);
  console.log('📋 Estados de la solicitud:', solicitud.estadosSolicitud);
  
  if (!solicitud.estadosSolicitud || solicitud.estadosSolicitud.length === 0) {
    console.log('❌ No hay estados en la solicitud');
    return null;
  }

  // Buscar el último estado que sea RECHAZADA
  const estadosRechazados = solicitud.estadosSolicitud.filter(estado => 
    estado.estado_actual === 'RECHAZADA' || estado.estado_actual === 'Rechazada'
  );

  console.log('🔍 Estados rechazados encontrados:', estadosRechazados);

  if (estadosRechazados.length === 0) {
    console.log('❌ No se encontraron estados de rechazo');
    return null;
  }

  // Obtener el último estado de rechazo
  const ultimoEstadoRechazo = estadosRechazados[estadosRechazados.length - 1];
  
  console.log('📝 Último estado de rechazo:', ultimoEstadoRechazo);
  console.log('💬 Comentario encontrado:', ultimoEstadoRechazo.comentario);
  
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

  console.log('📋 Datos que se envían al diálogo:');
  console.log('  - Título:', `Comentarios - ${solicitudCompleta.nombre_solicitud}`);
  console.log('  - Documentos:', solicitudCompleta.documentos);
  console.log('  - Comentario de rechazo:', comentarioRechazo);

  const dialogRef = this.dialog.open(ComentariosDialogComponent, {
    width: '700px',
    data: <ComentariosDialogData>{
      titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
      documentos: solicitudCompleta.documentos,
      comentarioRechazo: comentarioRechazo
    }
  });

  dialogRef.afterClosed().subscribe(() => {
    console.log('Diálogo de comentarios cerrado');
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
  console.log('🔍 Verificando funcionalidad de comentarios...');
  console.log('📋 Solicitudes completas:', this.solicitudesCompletas);
  console.log('📋 Solicitudes transformadas:', this.solicitudes);
  
  // Buscar solicitudes rechazadas
  const solicitudesRechazadas = this.solicitudes.filter(sol => 
    this.esSolicitudRechazada(sol.estado)
  );
  
  console.log('❌ Solicitudes rechazadas encontradas:', solicitudesRechazadas);
  
  solicitudesRechazadas.forEach(sol => {
    const tieneComentarios = this.tieneComentarios(sol.id);
    console.log(`📝 Solicitud ${sol.id} (${sol.nombre}): ${tieneComentarios ? 'Tiene comentarios' : 'Sin comentarios'}`);
  });
}


/**
 * Descargar oficio
 */
descargarOficio(idOficio: number, nombreArchivo: string): void {
  console.log('📥 Descargando oficio:', idOficio);
  console.log('📥 Nombre archivo recibido:', nombreArchivo);
  
  // Usar el mismo flujo que homologación: obtener oficios primero
  this.obtenerOficiosYDescargar(idOficio, nombreArchivo);
}

/**
 * Obtener oficios y descargar (igual que homologación)
 */
private obtenerOficiosYDescargar(idSolicitud: number, nombreArchivo: string): void {
  this.pazSalvoService.obtenerOficios(idSolicitud).subscribe({
    next: (oficios) => {
      console.log('📄 Oficios obtenidos:', oficios);
      
      if (!oficios || oficios.length === 0) {
        this.mostrarMensaje('No hay oficios disponibles para esta solicitud', 'warning');
        return;
      }
      
      // Tomar el primer oficio disponible
      const oficio = oficios[0];
      const nombreArchivoOficio = oficio.nombre || oficio.nombreArchivo || `oficio_paz_salvo_${idSolicitud}.pdf`;
      
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
  
  // Usar el endpoint específico de paz-salvo
  if (idSolicitud) {
    const url = `http://localhost:5000/api/solicitudes-pazysalvo/descargarOficio/${idSolicitud}`;
    
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
  } else {
    // Fallback: usar endpoint genérico si no hay idSolicitud
    console.log('⚠️ No hay idSolicitud, usando endpoint genérico');
    const url = `http://localhost:5000/api/archivos/descargar/pdf?filename=${encodeURIComponent(nombreArchivo)}`;
    
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
        console.log('✅ Archivo descargado exitosamente (endpoint genérico)');
        
        const blob = response.body!;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreDescarga || nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.mostrarMensaje('Archivo descargado exitosamente', 'success');
      },
      error: (err) => {
        console.error('❌ Error al descargar archivo (endpoint genérico):', err);
        this.mostrarMensaje('Error al descargar archivo: ' + (err.error?.message || err.message || 'Error desconocido'), 'error');
      }
    });
  }
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
  console.log(`🧪 Probando nombre ${index + 1}/${nombres.length}: "${nombre}"`);
  
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
  console.log('📄 Mostrando oficios en UI:', oficios);
  
  if (!oficios || oficios.length === 0) {
    this.mostrarMensaje('No hay oficios disponibles', 'info');
    return;
  }
  
  this.mostrarMensaje(`Se encontraron ${oficios.length} oficio(s) disponible(s)`, 'success');
}

}
