import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CursosIntersemestralesService, CreateInscripcionDTO, PreinscripcionSeguimiento } from '../../../core/services/cursos-intersemestrales.service';
import { ArchivosService } from '../../../core/services/archivos.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { MATERIAL_IMPORTS } from '../material.imports';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

export interface InscripcionModalData {
  preinscripcion: PreinscripcionSeguimiento;
}

@Component({
  selector: 'app-inscripcion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './inscripcion-modal.component.html',
  styleUrls: ['./inscripcion-modal.component.css']
})
export class InscripcionModalComponent implements OnInit {
  inscripcionForm!: FormGroup;
  archivoSeleccionado: File | null = null;
  cargando = false;
  usuario: any = null;
  errorArchivo: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InscripcionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InscripcionModalData,
    private cursosService: CursosIntersemestralesService,
    private archivosService: ArchivosService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private notificacionesService: NotificacionesService
  ) {
    this.inscripcionForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      codigo: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  private cargarDatosUsuario() {
    this.usuario = this.authService.getUsuario();
    // Usuario obtenido del AuthService
    
    if (this.usuario) {
      // Intentar diferentes campos posibles para el nombre
      const nombreCompleto = this.usuario.nombre_completo || this.usuario.nombreCompleto || this.usuario.nombres || this.usuario.nombre || this.usuario.first_name || '';
      const codigo = this.usuario.codigo || this.usuario.codigo_estudiante || this.usuario.documento || '';
      
      // Campos extraídos
      
      this.inscripcionForm.patchValue({
        nombreCompleto: nombreCompleto || 'Usuario no identificado',
        codigo: codigo || 'Sin código'
      });
      
      // Formulario actualizado
    } else {
      // No se pudo obtener el usuario del AuthService
      this.inscripcionForm.patchValue({
        nombreCompleto: 'Usuario no identificado',
        codigo: 'Sin código'
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    // Archivo seleccionado
    
    // Limpiar error anterior
    this.errorArchivo = null;
    
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        // Tipo de archivo incorrecto
        this.errorArchivo = 'Solo se permiten archivos PDF';
        this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', snackbarConfig(['warning-snackbar']));
        return;
      }
      
      // Validar tamaño (máximo 15MB temporalmente)
      const maxSize = 15 * 1024 * 1024; // 15MB en bytes (temporalmente aumentado)
      
      if (file.size > maxSize) {
        // Archivo muy grande
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        this.errorArchivo = `El archivo es muy grande (${fileSizeMB} MB). El límite máximo es 15 MB.`;
        this.snackBar.open(
          `El archivo es muy grande (${fileSizeMB} MB). El límite máximo es 15 MB.`, 
          'Cerrar', 
          snackbarConfig(['warning-snackbar'])
        );
        return;
      }
      
      this.archivoSeleccionado = file;
      // Archivo válido seleccionado
    }
  }

  onSubmit() {
    if (this.inscripcionForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    if (!this.archivoSeleccionado) {
      this.snackBar.open('Debes subir el comprobante de pago (PDF)', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    this.cargando = true;

    // Obtener nombre completo del usuario
    const nombreCompleto = this.usuario?.nombre_completo || 
                          this.usuario?.nombre || 
                          'Usuario';
    const nombreFinal = nombreCompleto.trim() !== '' ? nombreCompleto.trim() : 'Usuario';

    // Crear el payload para la inscripción
    const payload: CreateInscripcionDTO = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Solicitud Inscripción - ${nombreFinal}`
    };
    
    // Payload alternativo para debugging
    const payloadAlternativo = {
      estudianteId: this.usuario.id_usuario,
      cursoId: this.data.preinscripcion.cursoId,
      periodoId: 1, // Valor por defecto ya que no está en PreinscripcionSeguimiento
      tipoSolicitud: 'Inscripcion',
      nombreSolicitud: `Solicitud Inscripción - ${nombreFinal}`,
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId
    };
    
    // Payload alternativo

    // Creando inscripción con payload
    // Datos de la preinscripción
    // Usuario actual
    // Formulario válido
    // Archivo seleccionado

    // Intentar con payload más completo
    const payloadCompleto = {
      ...payload,
      estudianteId: this.usuario.id_usuario,
      cursoId: this.data.preinscripcion.cursoId,
      periodoId: 1, // Valor por defecto ya que no está en PreinscripcionSeguimiento
      tipoSolicitud: 'Inscripcion'
    };
    
    // Payload completo
    
    // Realizar diagnóstico completo antes de proceder
    this.realizarDiagnosticoCompleto();
  }

  private realizarDiagnosticoCompleto(): void {
    // Verificar todas las preinscripciones del usuario y filtrar por curso
    this.cursosService.getPreinscripcionesUsuario(this.usuario.id_usuario).subscribe({
      next: (todasPreinscripciones) => {
        // Filtrar preinscripciones para este curso específico
        const preinscripciones = todasPreinscripciones?.filter((p: any) => 
          p.id_curso === this.data.preinscripcion.cursoId || 
          p.cursoId === this.data.preinscripcion.cursoId ||
          p.objCurso?.id_curso === this.data.preinscripcion.cursoId
        ) || [];
        
        if (preinscripciones && preinscripciones.length > 0) {
          // Buscar una preinscripción aprobada
          const preinscripcionAprobada = preinscripciones.find((p: any) => p.estado === 'Aprobado');
          
          if (preinscripcionAprobada) {
            this.crearInscripcionDirecta();
          } else {
            this.procesarPreinscripcionesExistentes(preinscripciones);
          }
        } else {
          this.crearNuevaPreinscripcion();
        }
      },
      error: (error) => {
        // Continuando con flujo alternativo
        this.crearNuevaPreinscripcion();
      }
    });
  }

  private procesarPreinscripcionesExistentes(preinscripciones: any[]): void {
    // Buscar la preinscripción más reciente
    const preinscripcionMasReciente = preinscripciones.reduce((latest, current) => {
      const latestDate = new Date(latest.fecha || latest.createdAt || 0);
      const currentDate = new Date(current.fecha || current.createdAt || 0);
      return currentDate > latestDate ? current : latest;
    });
    
    // Intentar aprobar la preinscripción más reciente
    if (preinscripcionMasReciente.id_solicitud || preinscripcionMasReciente.id) {
      const idParaAprobar = preinscripcionMasReciente.id_solicitud || preinscripcionMasReciente.id;
      // Intentando aprobar preinscripción
      this.aprobarPreinscripcion(idParaAprobar);
    } else {
      // No se pudo obtener ID para aprobar, creando nueva preinscripción
      this.crearNuevaPreinscripcion();
    }
  }

  private crearNuevaPreinscripcion(): void {
    // Obtener nombre completo del usuario
    const nombreCompleto = this.usuario?.nombre_completo || 
                          this.usuario?.nombre || 
                          'Usuario';
    const nombreFinal = nombreCompleto.trim() !== '' ? nombreCompleto.trim() : 'Usuario';
    
    const preinscripcionPayload = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Solicitud Preinscripción - ${nombreFinal}`,
      condicion: 'Primera_Vez' // Valor por defecto
    };

    this.cursosService.crearPreinscripcion(preinscripcionPayload).subscribe({
      next: (preinscripcion) => {
        // Ahora aprobar la preinscripción
        this.aprobarPreinscripcion(preinscripcion.id_solicitud);
      },
      error: (error) => {
        this.cargando = false;
        this.snackBar.open(
          'Error al crear la preinscripción. Por favor, inténtalo de nuevo.',
          'Cerrar',
          snackbarConfig(['error-snackbar'])
        );
      }
    });
  }

  private aprobarPreinscripcion(preinscripcionId: number): void {
    this.cursosService.aprobarPreinscripcion(preinscripcionId).subscribe({
      next: (response) => {
        // Ahora crear la inscripción
        this.crearInscripcionDirecta();
      },
      error: (error) => {
        this.cargando = false;
        this.snackBar.open(
          'Error al aprobar la preinscripción. Por favor, inténtalo de nuevo.',
          'Cerrar',
          snackbarConfig(['error-snackbar'])
        );
      }
    });
  }

  private crearInscripcionDirecta(): void {
    // Obtener nombre completo del usuario
    const nombreCompleto = this.usuario?.nombre_completo || 
                          this.usuario?.nombre || 
                          'Usuario';
    const nombreFinal = nombreCompleto.trim() !== '' ? nombreCompleto.trim() : 'Usuario';
    
    const inscripcionPayload = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Solicitud Inscripción - ${nombreFinal}`
    };
    
    this.cursosService.crearInscripcion(inscripcionPayload).subscribe({
      next: (inscripcion) => {
        // Subir el archivo PDF
        this.subirArchivo(inscripcion.id_solicitud);
      },
      error: (error) => {
        
        this.cargando = false;
        
        let mensajeError = 'Error al crear la inscripción. Por favor, inténtalo de nuevo.';
        
        if (error.status === 0) {
          mensajeError = 'Error de conexión: No se puede conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 5000.';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor. Por favor, contacta al administrador.';
        } else if (error.status === 400) {
          // Mostrar el mensaje específico del backend si está disponible
          const backendMessage = error.error?.message || error.error?.error || 'Datos inválidos';
          mensajeError = `Error del servidor: ${backendMessage}`;
        } else if (error.status === 401) {
          mensajeError = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          mensajeError = 'No tienes permisos para realizar esta acción.';
        }
        
        this.snackBar.open(mensajeError, 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  private subirArchivo(inscripcionId: number) {
    if (!this.archivoSeleccionado) return;

    // Subiendo comprobante de pago para inscripción
    // Archivo a subir

    // Usar el método específico del servicio de cursos para subir comprobante de pago
    this.cursosService.subirComprobantePago(this.archivoSeleccionado, inscripcionId).subscribe({
      next: (resultado) => {
        // Comprobante de pago subido exitosamente
        // Archivo organizado en
        
        // Actualizar notificaciones después de crear la inscripción
        if (this.usuario?.id_usuario) {
          this.notificacionesService.actualizarNotificaciones(this.usuario.id_usuario);
        }
        
        this.cargando = false;
        this.snackBar.open(
          `Inscripción exitosa en ${this.data.preinscripcion.curso}. Comprobante de pago subido correctamente.`, 
          'Cerrar', 
          snackbarConfig(['success-snackbar'])
        );
        this.dialogRef.close(true); // Cerrar modal con éxito
      },
      error: (error) => {
        
        // Actualizar notificaciones incluso si falla la subida del archivo (la inscripción ya se creó)
        if (this.usuario?.id_usuario) {
          this.notificacionesService.actualizarNotificaciones(this.usuario.id_usuario);
        }
        
        this.cargando = false;
        this.snackBar.open('Inscripción creada exitosamente. Hubo un problema técnico al subir el comprobante de pago. Contacta al administrador para subirlo manualmente.', 'Cerrar', snackbarConfig(['warning-snackbar']));
        this.dialogRef.close(true); // Aún cerrar el modal ya que la inscripción se creó
      }
    });
  }

  onCancelar() {
    this.dialogRef.close(false);
  }

  getFileName(): string {
    return this.archivoSeleccionado ? this.archivoSeleccionado.name : 'Ningún archivo seleccionado';
  }

  get isFormValid(): boolean {
    return this.inscripcionForm.valid && this.archivoSeleccionado !== null;
  }
}
