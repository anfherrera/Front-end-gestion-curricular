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
    console.log('📝 PREINSCRIPCION DIALOG CARGADO para curso:', data.curso.nombre_curso);
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
      console.log('📝 Datos del usuario - Nombre:', nombreCompleto, 'Código:', codigo);
      this.preinscripcionForm.patchValue({
        nombreCompleto: nombreCompleto,
        codigo: codigo
      });
      console.log('✅ Formulario de preinscripción actualizado con datos del usuario');
    } else {
      console.log('❌ No se encontró usuario logueado');
    }
  }

  private loadCondiciones(): void {
    this.cursosService.getCondicionesSolicitud().subscribe({
      next: (condiciones) => {
        this.condiciones = condiciones;
        console.log('📋 Condiciones cargadas:', condiciones);
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
        nombreSolicitud: `Preinscripción - ${this.data.curso.nombre_curso}`
      };

      this.cursosService.crearPreinscripcion(payload).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open('¡Preinscripción enviada exitosamente!', 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          console.log('✅ Preinscripción creada:', response);
          this.dialogRef.close(true); // Cerrar con éxito
        },
        error: (error) => {
          this.loading = false;
          console.error('Error enviando preinscripción:', error);
          this.snackBar.open('Error al enviar la preinscripción. Inténtalo de nuevo.', 'Cerrar', {
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
}
