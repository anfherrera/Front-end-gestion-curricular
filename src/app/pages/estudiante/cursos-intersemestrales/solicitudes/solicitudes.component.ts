import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { 
  CursosIntersemestralesService, 
  CursoDisponible, 
  CondicionSolicitudVerano,
  CreateSolicitudCursoNuevoDTO 
} from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  solicitudForm!: FormGroup;
  loading = false;
  solicitudEnviada = false;
  
  // Datos del backend
  cursosDisponibles: CursoDisponible[] = [];
  condiciones: CondicionSolicitudVerano[] = [];
  usuario: any = null;

  constructor(
    private fb: FormBuilder,
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    console.log('✅ SOLICITUDES COMPONENT CARGADO - Formulario para solicitar curso nuevo');
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
    this.loadCursosDisponibles();
    this.loadCondiciones();
  }

  private initForm(): void {
    this.solicitudForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required, Validators.minLength(5)]],
      curso: ['', [Validators.required]],
      condicion: ['', [Validators.required]]
    });
  }

  private loadUserData(): void {
    this.usuario = this.authService.getUsuario();
    if (this.usuario) {
      this.solicitudForm.patchValue({
        nombreCompleto: `${this.usuario.nombre || ''} ${this.usuario.apellido || ''}`.trim(),
        codigo: this.usuario.codigo_estudiante || ''
      });
    }
  }

  private loadCursosDisponibles(): void {
    this.cursosService.getCursosDisponiblesParaSolicitud().subscribe({
      next: (cursos) => {
        this.cursosDisponibles = cursos;
        console.log('📚 Cursos disponibles cargados:', cursos);
      },
      error: (error) => {
        console.error('Error cargando cursos disponibles:', error);
        this.snackBar.open('Error al cargar los cursos disponibles', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
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

  onSubmitSolicitud(): void {
    if (this.solicitudForm.valid && this.usuario) {
      this.loading = true;
      
      const formData = this.solicitudForm.value;
      const payload: CreateSolicitudCursoNuevoDTO = {
        nombreCompleto: formData.nombreCompleto,
        codigo: formData.codigo,
        curso: formData.curso,
        condicion: formData.condicion,
        idUsuario: this.usuario.id_usuario
      };

      this.cursosService.crearSolicitudCursoNuevo(payload).subscribe({
        next: (response) => {
          this.loading = false;
          this.solicitudEnviada = true;
          this.solicitudForm.reset();
          this.loadUserData(); // Recargar datos del usuario
          this.snackBar.open('¡Solicitud enviada exitosamente!', 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          console.log('✅ Solicitud creada:', response);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error enviando solicitud:', error);
          this.snackBar.open('Error al enviar la solicitud. Inténtalo de nuevo.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onClearForm(): void {
    this.solicitudForm.reset();
    this.solicitudEnviada = false;
    this.loadUserData();
    this.snackBar.open('Formulario limpiado', 'Cerrar', {
      duration: 2000
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.solicitudForm.controls).forEach(key => {
      const control = this.solicitudForm.get(key);
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
