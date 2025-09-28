import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { 
  CursosIntersemestralesService, 
  CursoOfertadoVerano, 
  Materia, 
  Usuario, 
  CreateCursoDTO, 
  UpdateCursoDTO 
} from '../../../../core/services/cursos-intersemestrales.service';

@Component({
  selector: 'app-gestionar-cursos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    CardContainerComponent,
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './gestionar-cursos.component.html',
  styleUrls: ['./gestionar-cursos.component.css']
})
export class GestionarCursosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  cursos: CursoOfertadoVerano[] = [];
  materias: Materia[] = [];
  docentes: Usuario[] = [];
  cargando = true;
  
  // Formulario para crear/editar curso
  cursoForm: FormGroup;
  editando = false;
  cursoEditando: CursoOfertadoVerano | null = null;
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'nombre_curso', 
    'codigo_curso', 
    'objMateria', 
    'objDocente', 
    'fecha_inicio', 
    'fecha_fin', 
    'cupo_maximo', 
    'estado', 
    'acciones'
  ];

  constructor(
    private cursosService: CursosIntersemestralesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.cursoForm = this.fb.group({
      nombre_curso: ['', [Validators.required, Validators.minLength(3)]],
      codigo_curso: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      cupo_maximo: [25, [Validators.required, Validators.min(1), Validators.max(100)]],
      cupo_estimado: [25, [Validators.required, Validators.min(1), Validators.max(100)]],
      espacio_asignado: ['', [Validators.required, Validators.minLength(3)]],
      estado: ['Abierto', Validators.required],
      id_materia: ['', Validators.required],
      id_docente: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos() {
    this.cargando = true;
    console.log('🔄 Cargando datos para gestión de cursos...');
    
    // Cargar cursos, materias y docentes en paralelo
    this.cursosService.getTodosLosCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        console.log('✅ Cursos cargados:', cursos);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos:', err);
        this.cargando = false;
        // Datos de prueba si falla el backend
        this.cursos = this.getCursosPrueba();
      }
    });
  }

  // Datos de prueba para desarrollo
  private getCursosPrueba(): CursoOfertadoVerano[] {
    return [
      {
        id_curso: 1,
        nombre_curso: 'Programación Avanzada',
        codigo_curso: 'PROG-301',
        descripcion: 'Curso de programación avanzada con enfoque en algoritmos',
        fecha_inicio: new Date('2024-01-15'),
        fecha_fin: new Date('2024-02-15'),
        cupo_maximo: 25,
        cupo_disponible: 20,
        cupo_estimado: 25,
        espacio_asignado: 'Lab 301',
        estado: 'Abierto',
        objMateria: {
          id_materia: 1,
          nombre_materia: 'Programación',
          codigo_materia: 'PROG',
          creditos: 4
        },
        objDocente: {
          id_usuario: 2,
          nombre: 'María',
          apellido: 'García',
          email: 'maria.garcia@unicauca.edu.co',
          telefono: '3007654321',
          objRol: { id_rol: 2, nombre_rol: 'Docente' }
        }
      },
      {
        id_curso: 2,
        nombre_curso: 'Bases de Datos',
        codigo_curso: 'BD-201',
        descripcion: 'Fundamentos de bases de datos relacionales',
        fecha_inicio: new Date('2024-01-20'),
        fecha_fin: new Date('2024-02-20'),
        cupo_maximo: 30,
        cupo_disponible: 25,
        cupo_estimado: 30,
        espacio_asignado: 'Aula 205',
        estado: 'Publicado',
        objMateria: {
          id_materia: 2,
          nombre_materia: 'Bases de Datos',
          codigo_materia: 'BD',
          creditos: 3
        },
        objDocente: {
          id_usuario: 3,
          nombre: 'Carlos',
          apellido: 'López',
          email: 'carlos.lopez@unicauca.edu.co',
          telefono: '3009876543',
          objRol: { id_rol: 2, nombre_rol: 'Docente' }
        }
      }
    ];
  }

  // Abrir dialog para crear nuevo curso
  abrirDialogCrear() {
    this.editando = false;
    this.cursoEditando = null;
    this.cursoForm.reset({
      estado: 'Abierto',
      cupo_maximo: 25,
      cupo_estimado: 25
    });
  }

  // Abrir dialog para editar curso
  abrirDialogEditar(curso: CursoOfertadoVerano) {
    this.editando = true;
    this.cursoEditando = curso;
    
    this.cursoForm.patchValue({
      nombre_curso: curso.nombre_curso,
      codigo_curso: curso.codigo_curso,
      descripcion: curso.descripcion,
      fecha_inicio: this.formatearFechaParaInput(curso.fecha_inicio),
      fecha_fin: this.formatearFechaParaInput(curso.fecha_fin),
      cupo_maximo: curso.cupo_maximo,
      cupo_estimado: curso.cupo_estimado,
      espacio_asignado: curso.espacio_asignado,
      estado: curso.estado,
      id_materia: curso.objMateria.id_materia,
      id_docente: curso.objDocente.id_usuario
    });
  }

  // Guardar curso (crear o actualizar)
  guardarCurso() {
    if (this.cursoForm.valid) {
      const formData = this.cursoForm.value;
      
      if (this.editando && this.cursoEditando) {
        // Actualizar curso existente
        const updateData: UpdateCursoDTO = {
          ...formData,
          fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
          fecha_fin: new Date(formData.fecha_fin).toISOString()
        };
        
        this.cursosService.actualizarCurso(this.cursoEditando.id_curso, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (cursoActualizado) => {
              console.log('✅ Curso actualizado:', cursoActualizado);
              this.snackBar.open('Curso actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.cargarDatos();
            },
            error: (err) => {
              console.error('❌ Error actualizando curso:', err);
              this.snackBar.open('Error al actualizar el curso', 'Cerrar', { duration: 3000 });
            }
          });
      } else {
        // Crear nuevo curso
        const createData: CreateCursoDTO = {
          ...formData,
          fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
          fecha_fin: new Date(formData.fecha_fin).toISOString()
        };
        
        this.cursosService.crearCurso(createData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (nuevoCurso) => {
              console.log('✅ Curso creado:', nuevoCurso);
              this.snackBar.open('Curso creado exitosamente', 'Cerrar', { duration: 3000 });
              this.cargarDatos();
            },
            error: (err) => {
              console.error('❌ Error creando curso:', err);
              this.snackBar.open('Error al crear el curso', 'Cerrar', { duration: 3000 });
            }
          });
      }
    } else {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  // Eliminar curso
  eliminarCurso(curso: CursoOfertadoVerano) {
    if (confirm(`¿Estás seguro de que quieres eliminar el curso "${curso.nombre_curso}"?`)) {
      this.cursosService.eliminarCurso(curso.id_curso)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Curso eliminado:', curso.id_curso);
            this.snackBar.open('Curso eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.cargarDatos();
          },
          error: (err) => {
            console.error('❌ Error eliminando curso:', err);
            this.snackBar.open('Error al eliminar el curso', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }

  // Formatear fecha para input de tipo date
  private formatearFechaParaInput(fecha: Date): string {
    return new Date(fecha).toISOString().split('T')[0];
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  // Obtener color del estado
  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Abierto': return '#28a745';
      case 'Publicado': return '#17a2b8';
      case 'Preinscripcion': return '#ffc107';
      case 'Inscripcion': return '#fd7e14';
      case 'Cerrado': return '#dc3545';
      default: return '#6c757d';
    }
  }

  // Obtener icono del estado
  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'Abierto': return 'lock_open';
      case 'Publicado': return 'publish';
      case 'Preinscripcion': return 'person_add';
      case 'Inscripcion': return 'how_to_reg';
      case 'Cerrado': return 'lock';
      default: return 'help';
    }
  }
}
