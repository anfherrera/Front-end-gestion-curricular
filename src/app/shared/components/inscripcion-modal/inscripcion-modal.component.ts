import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CursosIntersemestralesService, CreateInscripcionDTO, PreinscripcionSeguimiento } from '../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { MATERIAL_IMPORTS } from '../material.imports';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { mensajeDeError } from '../../../core/utils/http-error.utils';

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
    this.verificarPreinscripcionAprobada();
  }

  /** Solo se puede inscribir quien tiene la preinscripción de este curso aprobada. */
  private verificarPreinscripcionAprobada(): void {
    this.cursosService.getPreinscripcionesUsuario(this.usuario.id_usuario).subscribe({
      next: (todasPreinscripciones) => {
        // Filtrar preinscripciones para este curso específico
        const preinscripciones = todasPreinscripciones?.filter((p: any) => 
          p.id_curso === this.data.preinscripcion.cursoId || 
          p.cursoId === this.data.preinscripcion.cursoId ||
          p.objCurso?.id_curso === this.data.preinscripcion.cursoId
        ) || [];
        
        // Solo se puede inscribir con una preinscripción ya APROBADA por un funcionario/coordinador.
        // (El estudiante no puede aprobar preinscripciones: el backend exige Funcionario/Coordinador/Administrador.)
        const preinscripcionAprobada = preinscripciones.find((p: any) => p.estado === 'Aprobado');

        if (preinscripcionAprobada) {
          this.crearInscripcionDirecta();
        } else {
          this.cargando = false;
          this.snackBar.open(
            preinscripciones.length > 0
              ? 'Tu preinscripción aún no ha sido aprobada. Podrás inscribirte cuando un funcionario la apruebe.'
              : 'No tienes una preinscripción para este curso. Preinscríbete primero desde "Cursos para preinscripción".',
            'Cerrar',
            snackbarConfig(['warning-snackbar'])
          );
        }
      },
      error: (error) => {
        this.cargando = false;
        this.snackBar.open(
          mensajeDeError(error, 'No se pudo verificar tu preinscripción. Por favor, inténtalo de nuevo.'),
          'Cerrar',
          snackbarConfig(['error-snackbar'])
        );
      }
    });
  }

  private crearInscripcionDirecta(): void {
    const nombreUsuario = (this.usuario?.nombre_completo || this.usuario?.nombre || '').trim() || 'Usuario';
    const inscripcionPayload: CreateInscripcionDTO = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Solicitud Inscripción - ${nombreUsuario}`
    };

    this.cursosService.crearInscripcion(inscripcionPayload).subscribe({
      next: (inscripcion) => this.subirArchivo(inscripcion.id_solicitud),
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
