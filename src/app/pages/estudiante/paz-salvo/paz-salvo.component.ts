import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { descargarBlob } from '../../../core/utils/download.util';
import { Subject, takeUntil } from 'rxjs';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';

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
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
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
  solicitudForm: FormGroup;
  requiereTrabajoGrado: boolean = false;
  maxDate: Date = new Date();

  SolicitudStatusEnum = SolicitudStatusEnum;

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

  // Archivos exclusivos: Para programas de Sistemas, Electrónica y Automática (solo uno de estos dos)
  // IMPORTANTE: Estos son DIFERENTES a PP-H (que está arriba en documentosRequeridos). 
  // - PP-H (con guion) = Constancia para modalidad PRÁCTICA PROFESIONAL (va con PP-G)
  // - PPH (sin guion) = Acta de sustentación para programas Sistemas, Electrónica, Automática
  // Estos formatos también se suben a SIMCA Web, pero deben adjuntarse aquí también
  archivosExclusivos: string[] = [
    'Formato PPH.pdf',
    'Formato TIH.pdf'
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
    private authService: AuthService,
    private fb: FormBuilder,
    private periodosService: PeriodosAcademicosService
  ) {
    // Inicializar formulario simplificado
    this.solicitudForm = this.fb.group({
      fecha_terminacion_plan: [null, Validators.required],
      titulo_trabajo_grado: [''],
      director_trabajo_grado: ['']
    });
  }

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
    }

    // Determinar si requiere trabajo de grado
    this.determinarRequisitosPrograma();

    // Configurar validaciones condicionales del formulario
    this.configurarValidacionesCondicionales();

    // El período académico se asignará automáticamente en el backend

    // Listar solicitudes existentes al cargar el componente
    this.listarSolicitudes();
    
    // Verificar funcionalidad de comentarios (para debugging)
    setTimeout(() => {
      this.verificarFuncionalidadComentarios();
    }, 2000);
  }

  /**
   * Determina si el programa del estudiante requiere trabajo de grado
   */
  private determinarRequisitosPrograma(): void {
    if (!this.usuario) {
      this.requiereTrabajoGrado = false;
      return;
    }

    const nombrePrograma = this.usuario?.objPrograma?.nombre_programa || this.usuario?.objPrograma?.nombre || '';
    const programa = nombrePrograma.toLowerCase();
    
    // Telemática NO requiere trabajo de grado
    const esTelematica = programa.includes('telemática') || programa.includes('telematica');
    
    // Sistemas, Electrónica, Automática SÍ requieren trabajo de grado
    this.requiereTrabajoGrado = !esTelematica && (
      programa.includes('sistemas') ||
      programa.includes('electrónica') ||
      programa.includes('electronica') ||
      programa.includes('automática') ||
      programa.includes('automatica') ||
      programa.includes('automatización') ||
      programa.includes('automatizacion')
    );
  }

  /**
   * Configura las validaciones condicionales del formulario
   */
  private configurarValidacionesCondicionales(): void {
    const tituloControl = this.solicitudForm.get('titulo_trabajo_grado');
    const directorControl = this.solicitudForm.get('director_trabajo_grado');

    if (this.requiereTrabajoGrado) {
      // Si requiere trabajo de grado, hacer los campos obligatorios
      tituloControl?.setValidators([Validators.required, Validators.maxLength(500)]);
      directorControl?.setValidators([Validators.required, Validators.maxLength(200)]);
    } else {
      // Si no requiere trabajo de grado, solo validar longitud máxima si se completa
      tituloControl?.setValidators([Validators.maxLength(500)]);
      directorControl?.setValidators([Validators.maxLength(200)]);
    }

    tituloControl?.updateValueAndValidity();
    directorControl?.updateValueAndValidity();
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
    if (!this.usuario || this.archivosActuales.length === 0) {
      return false;
    }

    // Validar que el formulario sea válido
    if (!this.solicitudForm.valid) {
      return false;
    }

    // Validar campos específicos del formulario
    const formValue = this.solicitudForm.value;
    
    // La fecha de terminación del plan es obligatoria
    if (!formValue.fecha_terminacion_plan) {
      return false;
    }

    const nombrePrograma = this.usuario?.objPrograma?.nombre_programa || this.usuario?.objPrograma?.nombre || '';
    const programa = nombrePrograma.toLowerCase();
    const esTelematica = programa.includes('telemática') || programa.includes('telematica');
    const requiereArchivoExclusivo = ['sistemas', 'electrónica', 'electrónica y telecomunicaciones', 'automática', 'automatización'].some(
      p => programa.includes(p.toLowerCase())
    );

    // Si requiere trabajo de grado, validar que los campos estén completos
    if (this.requiereTrabajoGrado) {
      const titulo = formValue.titulo_trabajo_grado?.trim() || '';
      const director = formValue.director_trabajo_grado?.trim() || '';
      
      if (!titulo || titulo.length === 0) {
        return false;
      }
      
      if (!director || director.length === 0) {
        return false;
      }
    }

    // Para Telemática, solo se requiere la cédula
    if (esTelematica) {
      const tieneFormatosIncorrectos = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('tig') || nombre.includes('tih') || 
               nombre.includes('ppg') || nombre.includes('pph') ||
               (nombre.includes('pp-h') && !nombre.includes('pph')) ||
               nombre.includes('pmfo4for27') || nombre.includes('hoja de vida') ||
               nombre.includes('autorizacion') || nombre.includes('autorización') ||
               nombre.includes('comprobante') || nombre.includes('trabajo de grado');
      });

      if (tieneFormatosIncorrectos) {
        return false;
      }

      // Para Telemática, solo la cédula es obligatoria
      const tieneCedula = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('cedula') || nombre.includes('cédula');
      });

      if (!tieneCedula) {
        return false;
      }

      return true; // Solo necesita la cédula
    }

    // Para otros programas, validar los documentos obligatorios
    const documentosObligatorios = this.documentosRequeridos.filter(doc => doc.obligatorio);
    const todosObligatoriosSubidos = documentosObligatorios.every(doc => 
      this.archivoSubido(doc.label)
    );

    if (!todosObligatoriosSubidos) {
      return false;
    }

    if (requiereArchivoExclusivo) {
      const tienePPH = this.archivosActuales.some(a => 
        this.normalizarNombre(a.nombre).includes('pph') && 
        !this.normalizarNombre(a.nombre).includes('pp-h')
      );
      const tieneTIH = this.archivosActuales.some(a => 
        this.normalizarNombre(a.nombre).includes('tih') && 
        !this.normalizarNombre(a.nombre).includes('ti-h')
      );
      
      if (!tienePPH && !tieneTIH) {
        return false;
      }
    }

    return true;
  }

  private archivoSubido(nombreDocumento: string): boolean {
    const nombreNormalizado = this.normalizarNombre(nombreDocumento);
    return this.archivosActuales.some(archivo => {
      const nombreArchivo = this.normalizarNombre(archivo.nombre);
      return nombreArchivo.includes(nombreNormalizado) || nombreNormalizado.includes(nombreArchivo);
    });
  }

  private normalizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]/g, '');
  }

  obtenerDocumentosFaltantes(): string[] {
    const faltantes: string[] = [];
    const errores: string[] = [];

    const nombrePrograma = this.usuario?.objPrograma?.nombre_programa || this.usuario?.objPrograma?.nombre || '';
    const programa = nombrePrograma.toLowerCase();
    const esTelematica = programa.includes('telemática') || programa.includes('telematica');
    const requiereArchivoExclusivo = ['sistemas', 'electrónica', 'electrónica y telecomunicaciones', 'automática', 'automatización'].some(
      p => programa.includes(p.toLowerCase())
    );

    // Para Telemática, solo se requiere la cédula
    if (esTelematica) {
      const tieneTI = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('tig') || nombre.includes('ti-h');
      });
      const tienePP = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('ppg') || (nombre.includes('pp-h') && !nombre.includes('pph'));
      });
      const tienePPH = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('pph') && !nombre.includes('pp-h');
      });
      const tieneTIH = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('tih') && !nombre.includes('ti-h');
      });
      const tieneDocumentosObligatorios = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('pmfo4for27') || nombre.includes('hoja de vida') ||
               nombre.includes('autorizacion') || nombre.includes('autorización') ||
               nombre.includes('comprobante') || nombre.includes('trabajo de grado');
      });

      if (tieneTI) {
        errores.push('Los formatos TI-G/TI-H no aplican para tu programa (Telemática)');
      }
      if (tienePP) {
        errores.push('Los formatos PP-G/PP-H no aplican para tu programa (Telemática)');
      }
      if (tienePPH || tieneTIH) {
        errores.push('Los formatos PPH/TIH no aplican para tu programa (Telemática)');
      }
      if (tieneDocumentosObligatorios) {
        errores.push('Los documentos obligatorios (PM-FO-4-FOR-27, Autorización, Comprobante, Trabajo de grado) no aplican para tu programa (Telemática)');
      }

      // Para Telemática, solo la cédula es obligatoria
      const tieneCedula = this.archivosActuales.some(a => {
        const nombre = this.normalizarNombre(a.nombre);
        return nombre.includes('cedula') || nombre.includes('cédula');
      });

      if (!tieneCedula) {
        faltantes.push('Fotocopia de cédula (obligatoria para Telemática)');
      }

      return [...faltantes, ...errores];
    }

    // Para otros programas, validar los documentos obligatorios
    const documentosObligatorios = this.documentosRequeridos.filter(doc => doc.obligatorio);
    documentosObligatorios.forEach(doc => {
      if (!this.archivoSubido(doc.label)) {
        faltantes.push(doc.label);
      }
    });

    if (requiereArchivoExclusivo) {
      const tienePPH = this.archivosActuales.some(a => 
        this.normalizarNombre(a.nombre).includes('pph') && 
        !this.normalizarNombre(a.nombre).includes('pp-h')
      );
      const tieneTIH = this.archivosActuales.some(a => 
        this.normalizarNombre(a.nombre).includes('tih') && 
        !this.normalizarNombre(a.nombre).includes('ti-h')
      );
      
      if (!tienePPH && !tieneTIH) {
        faltantes.push('Formato PPH o TIH (requerido para tu programa)');
      }
    }

    return [...faltantes, ...errores];
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

        // Paso 2: Preparar datos del formulario
        const formValue = this.solicitudForm.value;
        const fechaTerminacion = formValue.fecha_terminacion_plan instanceof Date
          ? formValue.fecha_terminacion_plan.toISOString().split('T')[0]
          : new Date(formValue.fecha_terminacion_plan).toISOString().split('T')[0];

        // Paso 3: Crear la solicitud con los datos del formulario
        // El backend espera: idUsuario, nombre_solicitud, fecha_registro_solicitud, periodo_academico (opcional),
        // titulo_trabajo_grado (opcional), director_trabajo_grado (opcional)
        // Obtener el nombre completo del usuario (puede estar en diferentes campos)
        const nombreCompleto = this.usuario?.nombre_completo || 
                               this.usuario?.nombre || 
                               this.usuario?.nombreCompleto ||
                               `${this.usuario?.primer_nombre || ''} ${this.usuario?.segundo_nombre || ''} ${this.usuario?.primer_apellido || ''} ${this.usuario?.segundo_apellido || ''}`.trim() ||
                               'Usuario';
        
        const datosSolicitud: any = {
          idUsuario: this.usuario.id_usuario,
          nombre_solicitud: `Paz y Salvo - ${nombreCompleto}`, // Formato: "Paz y Salvo - [nombre del estudiante]"
          fecha_registro_solicitud: fechaTerminacion // Usar la fecha de terminación del plan
        };

        // Agregar campos de trabajo de grado solo si son requeridos
        if (this.requiereTrabajoGrado) {
          if (formValue.titulo_trabajo_grado) {
            datosSolicitud.titulo_trabajo_grado = formValue.titulo_trabajo_grado;
          }
          if (formValue.director_trabajo_grado) {
            datosSolicitud.director_trabajo_grado = formValue.director_trabajo_grado;
          }
        }

        this.pazSalvoService.crearSolicitudConFormulario(this.usuario.id_usuario, archivosSubidos, datosSolicitud)
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
