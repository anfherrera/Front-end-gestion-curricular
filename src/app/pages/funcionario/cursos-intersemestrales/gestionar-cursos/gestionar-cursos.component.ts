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
import { CursoEstadosService, EstadoCurso } from '../../../../core/services/curso-estados.service';
import { EstadoFiltersComponent } from '../../../../shared/components/estado-filters/estado-filters.component';
import { ErrorHandlerService } from '../../../../shared/components/error-handler/error-handler.service';
import { CursoDialogComponent } from './curso-dialog.component';
import { EstudiantesCursoDialogComponent } from '../../../../shared/components/estudiantes-curso-dialog/estudiantes-curso-dialog.component';
import { PeriodoFiltroSelectorComponent } from '../../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';

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
    EstadoFiltersComponent,
    PeriodoFiltroSelectorComponent,
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './gestionar-cursos.component.html',
  styleUrls: ['./gestionar-cursos.component.css']
})
export class GestionarCursosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  cursos: CursoOfertadoVerano[] = [];
  cursosFiltrados: CursoOfertadoVerano[] = [];
  materias: Materia[] = [];
  docentes: Usuario[] = [];
  cargando = true;
  estadoFiltro = '';
  periodoFiltro: string = 'todos'; // Filtro por período académico - Inicializar con 'todos' para mostrar todos los cursos por defecto
  
  // Formulario para crear/editar curso
  cursoForm: FormGroup;
  editando = false;
  cursoEditando: CursoOfertadoVerano | null = null;
  
  // Formulario específico para edición (solo campos editables)
  edicionForm: FormGroup;
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'nombre_curso',
    'codigo_curso',
    'objMateria',
    'periodo',
    'grupo',
    'objDocente',
    'fecha_inicio',
    'fecha_fin',
    'cupo_maximo',
    'salon',
    'estado',
    'acciones'
  ];

  constructor(
    private cursosService: CursosIntersemestralesService,
    private cursoEstadosService: CursoEstadosService,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Formulario completo para crear cursos - Solo campos que el backend espera
    // NO incluir: nombre_curso, codigo_curso, descripcion, cupo_maximo (se obtienen automáticamente)
    this.cursoForm = this.fb.group({
      // Campos OBLIGATORIOS
      id_materia: ['', Validators.required],
      id_docente: ['', Validators.required],
      cupo_estimado: [25, [Validators.required, Validators.min(1), Validators.max(100)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      periodoAcademico: ['', Validators.required],
      
      // Campos OPCIONALES
      id_salon: [''], // Opcional - ID del salón seleccionado
      espacio_asignado: [''], // Deprecated - mantener para compatibilidad con edición
      estado: ['Abierto'], // Opcional - valor por defecto "Abierto"
      grupo: ['A'] // Opcional - valor por defecto "A" (A, B, C, D)
    });

    // Formulario específico para edición (solo campos editables)
    this.edicionForm = this.fb.group({
      cupo_estimado: [25, [Validators.required, Validators.min(1), Validators.max(100)]],
      id_salon: [''], // ID del salón seleccionado
      espacio_asignado: [''], // Deprecated: mantener para compatibilidad
      estado: ['Borrador', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    // Cargar materias y docentes reales del backend (sin datos de prueba)
    this.cargarMateriasYDocentes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos() {
    this.cargando = true;
    this.cursos = [];
    this.cursosFiltrados = [];
    
    // Determinar el período a usar: si es 'todos' o vacío, pasar null/undefined
    const periodoParam = this.periodoFiltro && this.periodoFiltro !== 'todos' && this.periodoFiltro.trim() !== '' 
      ? this.periodoFiltro.trim() 
      : undefined;
    
    
    // Cargar cursos del backend con filtro de período
    this.cursosService.getTodosLosCursosParaFuncionarios(periodoParam).subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.cursosFiltrados = [...cursos]; // Inicializar con todos los cursos
        // Cursos cargados del backend
        this.cargando = false;
      },
      error: (err) => {
        this.errorHandler.handleCargaError('cursos');
        this.cargando = false;
        // Mostrar mensaje de error sin datos de prueba
        this.cursos = [];
        this.cursosFiltrados = [];
        this.cargarMateriasYDocentes();
      }
    });
  }

  cargarMateriasYDocentes() {
    // Cargar materias reales del backend
    this.cursosService.getTodasLasMaterias().subscribe({
      next: (materias) => {
        this.materias = materias;
        // Materias cargadas del backend
      },
      error: (err) => {
        this.materias = []; // Array vacío en lugar de datos de prueba
        this.snackBar.open('No se pudieron cargar las materias. Verifica la conexión con el backend.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });

    // Cargar docentes reales del backend
    this.cursosService.getTodosLosDocentes().subscribe({
      next: (docentes) => {
        this.docentes = docentes;
        // Docentes cargados del backend
      },
      error: (err) => {
        this.docentes = []; // Array vacío en lugar de datos de prueba
        this.snackBar.open('No se pudieron cargar los docentes. Verifica la conexión con el backend.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // DATOS DE PRUEBA - SOLO PARA DESARROLLO/EMERGENCIA
  // Estos métodos YA NO SE USAN - Se cargan datos reales del backend
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
          codigo: 'PROG',
          nombre: 'Programación',
          creditos: 4,
          descripcion: 'Programación (PROG) - 4 créditos'
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
          codigo: 'BD',
          nombre: 'Bases de Datos',
          creditos: 3,
          descripcion: 'Bases de Datos (BD) - 3 créditos'
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

  // YA NO SE USA - Solo para emergencia si el backend falla
  private getMateriasPrueba(): Materia[] {
    return [
      {
        id_materia: 1,
        codigo: 'PROG',
        nombre: 'Programación',
        creditos: 4,
        descripcion: 'Programación (PROG) - 4 créditos'
      },
      {
        id_materia: 2,
        codigo: 'BD',
        nombre: 'Bases de Datos',
        creditos: 3,
        descripcion: 'Bases de Datos (BD) - 3 créditos'
      },
      {
        id_materia: 3,
        codigo: 'MAT',
        nombre: 'Matemáticas',
        creditos: 3,
        descripcion: 'Matemáticas (MAT) - 3 créditos'
      },
      {
        id_materia: 4,
        codigo: 'RED',
        nombre: 'Redes de Computadores',
        creditos: 4,
        descripcion: 'Redes de Computadores (RED) - 4 créditos'
      },
      {
        id_materia: 5,
        codigo: 'IS',
        nombre: 'Ingeniería de Software',
        creditos: 4,
        descripcion: 'Ingeniería de Software (IS) - 4 créditos'
      }
    ];
  }

  // Método duplicado eliminado - ahora se usa cargarMateriasYDocentes()

  // YA NO SE USA - Solo para emergencia si el backend falla
  private getDocentesPrueba(): Usuario[] {
    return [
      {
        id_usuario: 2,
        nombre: 'María',
        apellido: 'García',
        email: 'maria.garcia@unicauca.edu.co',
        telefono: '3007654321',
        objRol: { id_rol: 2, nombre_rol: 'Docente' }
      },
      {
        id_usuario: 3,
        nombre: 'Carlos',
        apellido: 'López',
        email: 'carlos.lopez@unicauca.edu.co',
        telefono: '3009876543',
        objRol: { id_rol: 2, nombre_rol: 'Docente' }
      },
      {
        id_usuario: 4,
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@unicauca.edu.co',
        telefono: '3001234567',
        objRol: { id_rol: 2, nombre_rol: 'Docente' }
      },
      {
        id_usuario: 5,
        nombre: 'Luis',
        apellido: 'Rodríguez',
        email: 'luis.rodriguez@unicauca.edu.co',
        telefono: '3004567890',
        objRol: { id_rol: 2, nombre_rol: 'Docente' }
      }
    ];
  }

  // Abrir dialog para crear nuevo curso
  abrirDialogCrear() {
    this.editando = false;
    this.cursoEditando = null;
    this.cursoForm.reset({
      estado: 'Abierto',
      cupo_estimado: 25,
      grupo: 'A'
    });

    // Abrir dialog
    const dialogRef = this.dialog.open(CursoDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        form: this.cursoForm,
        editando: this.editando,
        titulo: 'Crear Nuevo Curso',
        materias: this.materias,
        docentes: this.docentes
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog cerrado
      if (result === 'guardado') {
        this.cargarDatos();
      }
    });
  }

  abrirDialogEstudiantes(curso: CursoOfertadoVerano): void {
    this.dialog.open(EstudiantesCursoDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        idCurso: curso.id_curso,
        nombreCurso: curso.nombre_curso
      },
      disableClose: false
    });
  }

  // Abrir dialog para editar curso (solo campos editables)
  abrirDialogEditar(curso: CursoOfertadoVerano) {
    this.editando = true;
    this.cursoEditando = curso;
    
    // Solo llenar campos editables
    this.edicionForm.patchValue({
      cupo_estimado: curso.cupo_estimado,
      id_salon: curso.id_salon || curso.salonInfo?.id_salon || null,
      espacio_asignado: curso.espacio_asignado, // Mantener para compatibilidad
      estado: curso.estado
    });

    // Abrir dialog
    const dialogRef = this.dialog.open(CursoDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        form: this.edicionForm,
        editando: this.editando,
        titulo: 'Editar Curso',
        cursoEditando: curso,
        materias: this.materias,
        docentes: this.docentes,
        soloEdicion: true // Flag para indicar que es solo edición
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog de editar cerrado
      if (result === 'guardado') {
        this.cargarDatos();
      }
    });
  }

  // Guardar curso (crear o actualizar)
  guardarCurso() {
    if (this.editando && this.cursoEditando) {
      // Actualizar curso existente (solo campos editables)
      if (this.edicionForm.valid) {
        const formData = this.edicionForm.value;
        const updateData: UpdateCursoDTO = {
          cupo_estimado: formData.cupo_estimado,
          espacio_asignado: formData.espacio_asignado,
          estado: formData.estado
        };
        
        this.cursosService.actualizarCurso(this.cursoEditando.id_curso, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (cursoActualizado) => {
              // Curso actualizado
              this.snackBar.open('Curso actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.cargarDatos();
            },
            error: (err) => {
              this.errorHandler.handleCursoError(err, 'actualizar curso');
            }
          });
      } else {
        this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      }
    } else {
      // Crear nuevo curso
      if (this.cursoForm.valid) {
        const formData = this.cursoForm.value;
        const createData: CreateCursoDTO = {
          ...formData,
          fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
          fecha_fin: new Date(formData.fecha_fin).toISOString()
        };
        
        // Validar y normalizar el grupo si está presente
        if (createData.grupo) {
          const grupoUpper = String(createData.grupo).toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(grupoUpper)) {
            createData.grupo = grupoUpper;
          } else {
            // Si no es válido, eliminar para que el backend use "A" por defecto
            delete createData.grupo;
          }
        }
        
        this.cursosService.crearCurso(createData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (nuevoCurso) => {
              // Curso creado
              this.snackBar.open('Curso creado exitosamente', 'Cerrar', { duration: 3000 });
              this.cargarDatos();
            },
            error: (err) => {
              this.errorHandler.handleCursoError(err, 'crear curso');
            }
          });
      } else {
        this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      }
    }
  }

  // Eliminar curso
  eliminarCurso(curso: CursoOfertadoVerano) {
    const mensaje = `¿Estás seguro de que quieres eliminar el curso "${curso.nombre_curso}"?\n\n` +
                   `ADVERTENCIA: Esta acción no se puede deshacer.\n` +
                   `Si hay estudiantes inscritos, la eliminación fallará.`;
    
    if (confirm(mensaje)) {
      this.cursosService.eliminarCurso(curso.id_curso)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Curso eliminado
            this.snackBar.open('Curso eliminado exitosamente', 'Cerrar', { duration: 3000 });
            // Recargar datos inmediatamente
            this.cargarDatos();
          },
          error: (err) => {
            
            // Manejo específico de errores
            let mensajeError = 'Error al eliminar el curso';
            if (err.status === 400) {
              mensajeError = 'No se puede eliminar el curso porque tiene estudiantes inscritos';
            } else if (err.status === 404) {
              mensajeError = 'El curso no fue encontrado';
            } else if (err.status === 500) {
              mensajeError = 'Error interno del servidor';
            }
            
            this.snackBar.open(mensajeError, 'Cerrar', { duration: 5000 });
            // Recargar datos incluso si hay error para sincronizar
            this.cargarDatos();
          }
        });
    }
  }

  // Formatear fecha para date picker
  private formatearFechaParaInput(fecha: Date): Date {
    return new Date(fecha);
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  obtenerPeriodoCodigo(curso: CursoOfertadoVerano): string {
    return curso.periodo || curso.periodoAcademico || 'N/A';
  }

  obtenerPeriodoDescripcion(curso: CursoOfertadoVerano): string | null {
    const periodo = curso.periodo || curso.periodoAcademico;
    if (!periodo) {
      return null;
    }

    const [anio, numero] = periodo.split('-');
    if (!anio || !numero) {
      return null;
    }

    if (numero === '1') {
      return `Primer Período ${anio}`;
    }

    if (numero === '2') {
      return `Segundo Período ${anio}`;
    }

    return `Período ${numero} ${anio}`;
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

  // Obtener color del estado
  getEstadoColor(estado: string): string {
    return this.cursoEstadosService.getColorEstado(estado);
  }

  // Obtener icono del estado
  getIconoEstado(estado: string): string {
    return this.cursoEstadosService.getIconoEstado(estado);
  }

  // Validar si se puede editar un curso
  puedeEditar(curso: CursoOfertadoVerano): boolean {
    // Por ahora usar lógica básica, después se puede mejorar con roles
    return curso.estado !== 'Cerrado';
  }

  // Validar si se puede eliminar un curso
  puedeEliminar(curso: CursoOfertadoVerano): boolean {
    // Solo se puede eliminar en estado Borrador
    return curso.estado === 'Borrador';
  }

  // Validar transición de estado
  validarCambioEstado(estadoActual: string, nuevoEstado: string): boolean {
    return this.cursoEstadosService.validarTransicionEstado(estadoActual, nuevoEstado);
  }

  // Obtener estados permitidos para un curso
  getEstadosPermitidos(estadoActual: string): string[] {
    return this.cursoEstadosService.getEstadosPermitidos(estadoActual);
  }

  // Métodos para manejar filtros
  onCursosFiltradosChange(cursos: CursoOfertadoVerano[]): void {
    this.cursosFiltrados = cursos;
  }

  onEstadoSeleccionadoChange(estado: string): void {
    this.estadoFiltro = estado;
  }

  // Manejar cambio de período académico
  onPeriodoChange(periodo: string): void {
    // Actualizar el filtro y limpiar estado antes de recargar
    this.periodoFiltro = periodo;
    // Limpiar cursos inmediatamente para evitar mostrar datos antiguos
    this.cursos = [];
    this.cursosFiltrados = [];
    // Recargar cursos con el nuevo filtro
    this.cargarDatos();
  }

  // Método para actualizar cursos en el filtro
  actualizarCursosEnFiltro(): void {
    // Este método se puede llamar después de crear/editar/eliminar cursos
    // para actualizar el componente de filtros
  }

  // Exportar cursos a PDF
  exportarCursosPDF(): void {
    const periodoParam = this.periodoFiltro && this.periodoFiltro !== 'todos' && this.periodoFiltro.trim() !== '' 
      ? this.periodoFiltro.trim() 
      : undefined;
    
    
    this.cursosService.exportarCursosPDF(periodoParam).subscribe({
      next: (result) => {
        // Crear enlace temporal para descargar el archivo
        const urlBlob = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);
        
        this.snackBar.open('PDF exportado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        let mensajeError = 'Error al exportar el PDF';
        
        if (err.status === 401) {
          mensajeError = 'Sesión expirada. Por favor, inicia sesión nuevamente';
        } else if (err.status === 403) {
          mensajeError = 'No tienes permisos para exportar cursos';
        } else if (err.status === 404) {
          mensajeError = 'No se encontraron cursos para exportar';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor al generar el PDF';
        }
        
        this.snackBar.open(mensajeError, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
