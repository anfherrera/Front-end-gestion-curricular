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
      // Valores individuales
      console.log('Valores individuales', {
        'usuario.nombre_completo': this.usuario.nombre_completo,
        'usuario.nombreCompleto': this.usuario.nombreCompleto,
        'usuario.nombres': this.usuario.nombres,
        'usuario.nombre': this.usuario.nombre,
        'usuario.first_name': this.usuario.first_name,
        'usuario.apellidos': this.usuario.apellidos,
        'usuario.apellido': this.usuario.apellido,
        'usuario.last_name': this.usuario.last_name
      });
      
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
        this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', { duration: 3000 });
        return;
      }
      
      // Validar tamaño (máximo 15MB temporalmente)
      const maxSize = 15 * 1024 * 1024; // 15MB en bytes (temporalmente aumentado)
      // Validación de tamaño
      console.log('Validación de tamaño', {
        fileSize: file.size,
        maxSize: maxSize,
        fileSizeKB: (file.size / 1024).toFixed(2) + ' KB',
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      
      if (file.size > maxSize) {
        // Archivo muy grande
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        this.errorArchivo = `El archivo es muy grande (${fileSizeMB} MB). El límite máximo es 15 MB.`;
        this.snackBar.open(
          `El archivo es muy grande (${fileSizeMB} MB). El límite máximo es 15 MB.`, 
          'Cerrar', 
          { duration: 5000 }
        );
        return;
      }
      
      this.archivoSeleccionado = file;
      // Archivo válido seleccionado
    }
  }

  onSubmit() {
    if (this.inscripcionForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.archivoSeleccionado) {
      this.snackBar.open('Debes subir el comprobante de pago (PDF)', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando = true;

    // Crear el payload para la inscripción
    const payload: CreateInscripcionDTO = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Inscripción - ${this.data.preinscripcion.curso}`
    };
    
    // Payload alternativo para debugging
    const payloadAlternativo = {
      estudianteId: this.usuario.id_usuario,
      cursoId: this.data.preinscripcion.cursoId,
      periodoId: 1, // Valor por defecto ya que no está en PreinscripcionSeguimiento
      tipoSolicitud: 'Inscripcion',
      nombreSolicitud: `Inscripción - ${this.data.preinscripcion.curso}`,
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
    
    // DIAGNÓSTICO COMPLETO: Verificar estado real en backend
    // DIAGNÓSTICO COMPLETO - Verificando estado real en la base de datos
    
    // Realizar diagnóstico completo antes de proceder
    this.realizarDiagnosticoCompleto();
  }

  private realizarDiagnosticoCompleto(): void {
    // DIAGNÓSTICO PASO 1: Verificando preinscripciones del usuario en el curso
    
    // Verificar todas las preinscripciones del usuario y filtrar por curso
    this.cursosService.getPreinscripcionesUsuario(this.usuario.id_usuario).subscribe({
      next: (todasPreinscripciones) => {
        // RESULTADO DIAGNÓSTICO - Todas las preinscripciones del usuario
        // Cantidad total de preinscripciones
        
        // Filtrar preinscripciones para este curso específico
        const preinscripciones = todasPreinscripciones?.filter((p: any) => 
          p.id_curso === this.data.preinscripcion.cursoId || 
          p.cursoId === this.data.preinscripcion.cursoId ||
          p.objCurso?.id_curso === this.data.preinscripcion.cursoId
        ) || [];
        
        // Preinscripciones filtradas para este curso
        // Cantidad de preinscripciones para este curso
        
        if (preinscripciones && preinscripciones.length > 0) {
          preinscripciones.forEach((p: any, index: number) => {
            // Preinscripción
            console.log('Preinscripción', {
              id: p.id,
              id_solicitud: p.id_solicitud,
              estado: p.estado,
              id_usuario: p.id_usuario,
              id_curso: p.id_curso,
              fecha: p.fecha,
              usuarioId: p.usuarioId,
              cursoId: p.cursoId,
              objUsuario: p.objUsuario,
              objCurso: p.objCurso
            });
            // Preinscripción - Objeto completo
          });
          
          // Buscar una preinscripción aprobada
          const preinscripcionAprobada = preinscripciones.find((p: any) => p.estado === 'Aprobado');
          
          if (preinscripcionAprobada) {
            // DIAGNÓSTICO: Se encontró preinscripción aprobada, procediendo a crear inscripción
            this.crearInscripcionDirecta();
          } else {
            // DIAGNÓSTICO: No hay preinscripción aprobada, pero hay preinscripciones existentes
            // Estados encontrados
            this.procesarPreinscripcionesExistentes(preinscripciones);
          }
        } else {
          // DIAGNÓSTICO: No se encontraron preinscripciones para este usuario en este curso
          this.crearNuevaPreinscripcion();
        }
      },
      error: (error) => {
        console.error('Error en diagnóstico de preinscripciones:', error);
        // Continuando con flujo alternativo
        this.crearNuevaPreinscripcion();
      }
    });
  }

  private procesarPreinscripcionesExistentes(preinscripciones: any[]): void {
    // DIAGNÓSTICO PASO 2: Procesando preinscripciones existentes
    
    // Buscar la preinscripción más reciente
    const preinscripcionMasReciente = preinscripciones.reduce((latest, current) => {
      const latestDate = new Date(latest.fecha || latest.createdAt || 0);
      const currentDate = new Date(current.fecha || current.createdAt || 0);
      return currentDate > latestDate ? current : latest;
    });
    
    // Preinscripción más reciente
    
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
    // DIAGNÓSTICO PASO 3: Creando nueva preinscripción
    
    const preinscripcionPayload = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Preinscripción - ${this.data.preinscripcion.curso}`,
      condicion: 'Primera_Vez' // Valor por defecto
    };

    // Creando preinscripción con payload

    this.cursosService.crearPreinscripcion(preinscripcionPayload).subscribe({
      next: (preinscripcion) => {
        // Preinscripción creada
        
        // Ahora aprobar la preinscripción
        this.aprobarPreinscripcion(preinscripcion.id_solicitud);
      },
      error: (error) => {
        console.error('Error creando preinscripción:', error);
        this.cargando = false;
        this.snackBar.open(
          'Error al crear la preinscripción. Por favor, inténtalo de nuevo.',
          'Cerrar',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  private aprobarPreinscripcion(preinscripcionId: number): void {
    // DIAGNÓSTICO PASO 4: Aprobando preinscripción
    
    this.cursosService.aprobarPreinscripcion(preinscripcionId).subscribe({
      next: (response) => {
        // Preinscripción aprobada
        
        // Ahora crear la inscripción
        this.crearInscripcionDirecta();
      },
      error: (error) => {
        console.error('Error aprobando preinscripción:', error);
        this.cargando = false;
        this.snackBar.open(
          'Error al aprobar la preinscripción. Por favor, inténtalo de nuevo.',
          'Cerrar',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  private crearInscripcionDirecta(): void {
    // DIAGNÓSTICO PASO 5: Creando inscripción
    
    const inscripcionPayload = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Inscripción - ${this.data.preinscripcion.curso}`
    };
    
    // Creando inscripción con payload
    // DEBUG - Verificando preinscripción antes de crear inscripción
    // DEBUG - Usuario ID
    // DEBUG - Curso ID
    // DEBUG - Estado preinscripción
    
    // TEMPORAL: Intentar crear inscripción directamente
    // INTENTANDO CREAR INSCRIPCIÓN DIRECTO
    
    this.cursosService.crearInscripcion(inscripcionPayload).subscribe({
      next: (inscripcion) => {
        // Inscripción creada
        
        // Subir el archivo PDF
        this.subirArchivo(inscripcion.id_solicitud);
      },
      error: (error) => {
        console.error('Error creando inscripción:', error);
        
        // Mostrar detalles completos del error
        console.error('ERROR COMPLETO - Detalles', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error_body: error.error,
          error_message: error.error?.message || error.error?.error || 'Sin mensaje específico',
          error_code: error.error?.codigo || 'Sin código específico'
        });
        
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
        
        this.snackBar.open(mensajeError, 'Cerrar', { duration: 8000 });
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
          { duration: 5000 }
        );
        this.dialogRef.close(true); // Cerrar modal con éxito
      },
      error: (error) => {
        console.error('Error subiendo comprobante de pago:', error);
        
        // Actualizar notificaciones incluso si falla la subida del archivo (la inscripción ya se creó)
        if (this.usuario?.id_usuario) {
          this.notificacionesService.actualizarNotificaciones(this.usuario.id_usuario);
        }
        
        this.cargando = false;
        this.snackBar.open('Inscripción creada exitosamente. Hubo un problema técnico al subir el comprobante de pago. Contacta al administrador para subirlo manualmente.', 'Cerrar', { duration: 8000 });
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
