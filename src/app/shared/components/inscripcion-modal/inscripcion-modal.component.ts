import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CursosIntersemestralesService, CreateInscripcionDTO, PreinscripcionSeguimiento } from '../../../core/services/cursos-intersemestrales.service';
import { ArchivosService } from '../../../core/services/archivos.service';
import { AuthService } from '../../../core/services/auth.service';
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
  inscripcionForm: FormGroup;
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
    private snackBar: MatSnackBar
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
    console.log('🔍 Usuario obtenido del AuthService:', this.usuario);
    console.log('🔍 Claves disponibles en el usuario:', Object.keys(this.usuario || {}));
    
    if (this.usuario) {
      // Intentar diferentes campos posibles para el nombre
      const nombreCompleto = this.usuario.nombre_completo || this.usuario.nombreCompleto || this.usuario.nombres || this.usuario.nombre || this.usuario.first_name || '';
      const codigo = this.usuario.codigo || this.usuario.codigo_estudiante || this.usuario.documento || '';
      
      console.log('🔍 Campos extraídos:', { nombreCompleto, codigo });
      console.log('🔍 Valores individuales:', {
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
      
      console.log('✅ Formulario actualizado:', this.inscripcionForm.value);
    } else {
      console.log('❌ No se pudo obtener el usuario del AuthService');
      this.inscripcionForm.patchValue({
        nombreCompleto: 'Usuario no identificado',
        codigo: 'Sin código'
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    console.log('📄 Archivo seleccionado:', file);
    
    // Limpiar error anterior
    this.errorArchivo = null;
    
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        console.log('❌ Tipo de archivo incorrecto:', file.type);
        this.errorArchivo = 'Solo se permiten archivos PDF';
        this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', { duration: 3000 });
        return;
      }
      
      // Validar tamaño (máximo 15MB temporalmente)
      const maxSize = 15 * 1024 * 1024; // 15MB en bytes (temporalmente aumentado)
      console.log('🔍 Validación de tamaño:', {
        fileSize: file.size,
        maxSize: maxSize,
        fileSizeKB: (file.size / 1024).toFixed(2) + ' KB',
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      
      if (file.size > maxSize) {
        console.log('❌ Archivo muy grande:', file.size, 'bytes');
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
      console.log('✅ Archivo válido seleccionado:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
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
    
    console.log('🔍 Payload alternativo:', payloadAlternativo);

    console.log('📝 Creando inscripción con payload:', payload);
    console.log('🔍 Datos de la preinscripción:', this.data.preinscripcion);
    console.log('🔍 Usuario actual:', this.usuario);
    console.log('🔍 Formulario válido:', this.inscripcionForm.valid);
    console.log('🔍 Archivo seleccionado:', this.archivoSeleccionado?.name, this.archivoSeleccionado?.size, 'bytes');

    // Intentar con payload más completo
    const payloadCompleto = {
      ...payload,
      estudianteId: this.usuario.id_usuario,
      cursoId: this.data.preinscripcion.cursoId,
      periodoId: 1, // Valor por defecto ya que no está en PreinscripcionSeguimiento
      tipoSolicitud: 'Inscripcion'
    };
    
    console.log('🔍 Payload completo:', payloadCompleto);
    
    this.cursosService.crearInscripcion(payloadCompleto as any).subscribe({
      next: (inscripcion) => {
        console.log('✅ Inscripción creada:', inscripcion);
        
        // Subir el archivo PDF
        this.subirArchivo(inscripcion.id_solicitud);
      },
      error: (error) => {
        console.error('❌ Error creando inscripción:', error);
        this.cargando = false;
        
        let mensajeError = 'Error al crear la inscripción. Por favor, inténtalo de nuevo.';
        
        if (error.status === 0) {
          mensajeError = 'Error de conexión: No se puede conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 5000.';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor. Por favor, contacta al administrador.';
        } else if (error.status === 400) {
          mensajeError = 'Datos inválidos. Por favor, verifica la información ingresada.';
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

    console.log('📤 Subiendo archivo para inscripción ID:', inscripcionId);
    console.log('🔍 Archivo a subir:', this.archivoSeleccionado.name, this.archivoSeleccionado.size, 'bytes');

    this.archivosService.subirPDF(this.archivoSeleccionado, inscripcionId).subscribe({
      next: (archivo) => {
        console.log('✅ Archivo subido exitosamente:', archivo);
        this.cargando = false;
        this.snackBar.open(
          `Inscripción exitosa en ${this.data.preinscripcion.curso}. Comprobante de pago subido correctamente.`, 
          'Cerrar', 
          { duration: 5000 }
        );
        this.dialogRef.close(true); // Cerrar modal con éxito
      },
      error: (error) => {
        console.error('❌ Error subiendo archivo:', error);
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
