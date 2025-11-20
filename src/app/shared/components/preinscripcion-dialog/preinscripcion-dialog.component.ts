import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { 
  CursosIntersemestralesService, 
  CursoOfertadoVerano,
  CreatePreinscripcionDTO,
  CondicionSolicitudVerano 
} from '../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../core/services/auth.service';

export interface PreinscripcionDialogData {
  curso: CursoOfertadoVerano;
}

@Component({
  selector: 'app-preinscripcion-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './preinscripcion-dialog.component.html',
  styleUrls: ['./preinscripcion-dialog.component.css']
})
export class PreinscripcionDialogComponent implements OnInit {
  preinscripcionForm!: FormGroup;
  loading = false;
  usuario: any = null;
  condiciones: CondicionSolicitudVerano[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreinscripcionDialogData,
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // PREINSCRIPCION DIALOG CARGADO para curso
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
    this.loadCondiciones();
  }

  private initForm(): void {
    this.preinscripcionForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required, Validators.minLength(5)]],
      condicion: ['', [Validators.required]]
    });
  }

  private loadUserData(): void {
    this.usuario = this.authService.getUsuario();
    console.log('👤 Usuario cargado en preinscripción:', this.usuario);
    if (this.usuario) {
      // Usar los campos correctos del usuario
      const nombreCompleto = this.usuario.nombre_completo || `${this.usuario.nombre || ''} ${this.usuario.apellido || ''}`.trim();
      const codigo = this.usuario.codigo || this.usuario.codigo_estudiante || '';
      // Datos del usuario
      this.preinscripcionForm.patchValue({
        nombreCompleto: nombreCompleto,
        codigo: codigo
      });
      // Formulario de preinscripción actualizado con datos del usuario
    } else {
      // No se encontró usuario logueado
    }
  }

  private loadCondiciones(): void {
    this.cursosService.getCondicionesSolicitud().subscribe({
      next: (condiciones) => {
        this.condiciones = condiciones;
        // Condiciones cargadas
      },
      error: (error) => {
        console.error('Error cargando condiciones:', error);
        // Si falla, usar las condiciones por defecto
        this.condiciones = [
          CondicionSolicitudVerano.Primera_Vez,
          CondicionSolicitudVerano.Habilitacion,
          CondicionSolicitudVerano.Repeticion
        ];
      }
    });
  }

  onSubmitPreinscripcion(): void {
    if (this.preinscripcionForm.valid && this.usuario) {
      this.loading = true;
      
      const formData = this.preinscripcionForm.value;
      const payload: CreatePreinscripcionDTO = {
        idUsuario: this.usuario.id_usuario,
        idCurso: this.data.curso.id_curso,
        nombreSolicitud: `Preinscripción - ${this.data.curso.nombre_curso}`,
        condicion: formData.condicion
      };

      this.cursosService.crearPreinscripcion(payload).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open('¡Preinscripción enviada exitosamente!', 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          // Preinscripción creada
          this.dialogRef.close(true); // Cerrar con éxito
        },
        error: (error) => {
          this.loading = false;
          console.error('Error enviando preinscripción:', error);
          
          // Manejar diferentes tipos de errores
          let mensaje = 'Error al enviar la preinscripción. Inténtalo de nuevo.';
          
          if (error.error && error.error.codigo === 'DUPLICATE_PREINSCRIPTION') {
            mensaje = 'Ya tienes una preinscripción activa para este curso.';
          } else if (error.error && error.error.codigo === 'COURSE_NOT_AVAILABLE') {
            mensaje = 'Este curso no está disponible para preinscripción.';
          } else if (error.error && error.error.codigo === 'NO_CUPOS_AVAILABLE') {
            mensaje = 'No hay cupos disponibles para este curso.';
          } else if (error.status === 400) {
            mensaje = 'Datos inválidos. Verifica la información e inténtalo de nuevo.';
          } else if (error.status === 500) {
            mensaje = 'Error del servidor. Inténtalo más tarde.';
          }
          
          this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.preinscripcionForm.controls).forEach(key => {
      const control = this.preinscripcionForm.get(key);
      control?.markAsTouched();
    });
  }

  getCondicionDisplayName(condicion: CondicionSolicitudVerano): string {
    switch (condicion) {
      case CondicionSolicitudVerano.Primera_Vez:
        return 'Primera Vez';
      case CondicionSolicitudVerano.Habilitacion:
        return 'Habilitación';
      case CondicionSolicitudVerano.Repeticion:
        return 'Repetición';
      default:
        return condicion;
    }
  }

  // Obtener nombre del docente de forma segura
  obtenerNombreDocente(curso: CursoOfertadoVerano): string {
    if (!curso.objDocente) {
      return 'Sin asignar';
    }
    
    // Priorizar nombre_docente (estructura del backend)
    if ((curso.objDocente as any).nombre_docente) {
      return (curso.objDocente as any).nombre_docente;
    }
    
    // Fallback a nombre y apellido (estructura legacy)
    if (curso.objDocente.nombre && curso.objDocente.apellido) {
      return `${curso.objDocente.nombre} ${curso.objDocente.apellido}`;
    }
    
    if (curso.objDocente.nombre) {
      return curso.objDocente.nombre;
    }
    
    return 'Sin nombre';
  }
}
