import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { 
  CursosIntersemestralesService, 
  CursoDisponible, 
  Materia,
  CondicionSolicitudVerano,
  CreateSolicitudCursoNuevoDTO 
} from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiEndpoints } from '../../../../core/utils/api-endpoints';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';

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
  materiasDisponibles: Materia[] = [];
  condiciones: CondicionSolicitudVerano[] = [];
  usuario: any = null;

  constructor(
    private fb: FormBuilder,
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private notificacionesService: NotificacionesService
  ) {
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
      // Usar los campos correctos del usuario
      const nombreCompleto = this.usuario.nombre_completo || `${this.usuario.nombre || ''} ${this.usuario.apellido || ''}`.trim();
      const codigo = this.usuario.codigo || this.usuario.codigo_estudiante || '';
      this.solicitudForm.patchValue({
        nombreCompleto: nombreCompleto,
        codigo: codigo
      });
    } else {
    }
  }

  private loadCursosDisponibles(): void {
    this.cursosService.getMateriasDisponibles().subscribe({
      next: (materias) => {
        this.materiasDisponibles = materias;
      },
      error: (error) => {
        this.snackBar.open('Error al cargar las materias disponibles', 'Cerrar', {
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
      },
      error: (error) => {
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
          
          // Actualizar notificaciones después de crear la solicitud
          if (this.usuario?.id_usuario) {
            this.notificacionesService.actualizarNotificaciones(this.usuario.id_usuario);
          }
          
          this.snackBar.open('¡Solicitud enviada exitosamente!', 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.loading = false;
          
          // Manejar diferentes tipos de errores
          let mensaje = 'Error al enviar la solicitud. Inténtalo de nuevo.';
          
          if (error.status === 500) {
            mensaje = 'Error del servidor. Por favor, verifica los datos e inténtalo de nuevo.';
          } else if (error.status === 400) {
            mensaje = 'Datos inválidos. Verifica la información e inténtalo de nuevo.';
          } else if (error.status === 401) {
            mensaje = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          } else if (error.status === 403) {
            mensaje = 'No tienes permisos para realizar esta acción.';
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

  private loadMateriasDisponiblesPrueba(): void {
    this.materiasDisponibles = [
      {
        id_materia: 1,
        codigo: 'BD001',
        nombre: 'Bases de Datos',
        creditos: 3,
        descripcion: 'Bases de Datos (BD001) - 3 créditos'
      },
      {
        id_materia: 2,
        codigo: 'PRO001',
        nombre: 'Programación I',
        creditos: 4,
        descripcion: 'Programación I (PRO001) - 4 créditos'
      },
      {
        id_materia: 3,
        codigo: 'WEB001',
        nombre: 'Desarrollo Web',
        creditos: 3,
        descripcion: 'Desarrollo Web (WEB001) - 3 créditos'
      },
      {
        id_materia: 4,
        codigo: 'IA001',
        nombre: 'Inteligencia Artificial',
        creditos: 4,
        descripcion: 'Inteligencia Artificial (IA001) - 4 créditos'
      }
    ];
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
