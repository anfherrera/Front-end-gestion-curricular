import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, filter, switchMap, takeUntil } from 'rxjs';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano, Docente, Materia } from '../../../../core/models/cursos-intersemestrales.model';
import { descargarBlob } from '../../../../core/utils/download.util';
import { CursoEstadosService } from '../../../../core/services/curso-estados.service';
import { EstadoFiltersComponent } from '../../../../shared/components/estado-filters/estado-filters.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CursoDialogComponent } from './curso-dialog.component';
import { EstudiantesCursoDialogComponent } from '../../../../shared/components/estudiantes-curso-dialog/estudiantes-curso-dialog.component';
import { PeriodoFiltroSelectorComponent } from '../../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';
import { FechaPipe } from '../../../../shared/pipes/fecha.pipe';
import { NombreDocentePipe } from '../../../../shared/pipes/nombre-docente.pipe';
import { confirmar } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    ...MATERIAL_IMPORTS,
    FechaPipe,
    NombreDocentePipe
  ],
  templateUrl: './gestionar-cursos.component.html',
  styleUrls: ['./gestionar-cursos.component.css']
})
export class GestionarCursosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  cursos: CursoOfertadoVerano[] = [];
  cursosFiltrados: CursoOfertadoVerano[] = [];
  materias: Materia[] = [];
  docentes: Docente[] = [];
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
    private snackbarService: SnackbarService,
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
    this.cursosService.getTodosLosCursosParaFuncionarios(periodoParam).pipe(takeUntil(this.destroy$)).subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.cursosFiltrados = [...cursos]; // Inicializar con todos los cursos
        this.cargando = false;
      },
      error: () => {
        this.snackbarService.warning('No se pudieron cargar los cursos - Intenta recargar la página');
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
    this.cursosService.getTodasLasMaterias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (materias) => {
        this.materias = materias;
      },
      error: () => {
        this.materias = []; // Array vacío en lugar de datos de prueba
        this.snackBar.open('No se pudieron cargar las materias. Verifica la conexión con el backend.', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });

    // Cargar docentes reales del backend
    this.cursosService.getTodosLosDocentes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (docentes) => {
        this.docentes = docentes;
      },
      error: () => {
        this.docentes = []; // Array vacío en lugar de datos de prueba
        this.snackBar.open('No se pudieron cargar los docentes. Verifica la conexión con el backend.', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  // Método duplicado eliminado - ahora se usa cargarMateriasYDocentes()

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

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
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

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result === 'guardado') {
        this.cargarDatos();
      }
    });
  }

  eliminarCurso(curso: CursoOfertadoVerano) {
    confirmar(this.dialog, {
      titulo: 'Eliminar curso',
      mensaje: `¿Estás seguro de que quieres eliminar el curso "${curso.nombre_curso}"?\n\n` +
               `Esta acción no se puede deshacer. Si hay estudiantes inscritos, la eliminación fallará.`,
      textoConfirmar: 'Eliminar',
      peligro: true
    }).pipe(
      filter(Boolean),
      switchMap(() => this.cursosService.eliminarCurso(curso.id_curso)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Curso eliminado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarDatos();
      },
      error: (err) => {
        let mensajeError = 'Error al eliminar el curso';
        if (err.status === 400) {
          mensajeError = 'No se puede eliminar el curso porque tiene estudiantes inscritos';
        } else if (err.status === 404) {
          mensajeError = 'El curso no fue encontrado';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor';
        }
        this.snackBar.open(mensajeError, 'Cerrar', snackbarConfig(['error-snackbar']));
        // Recargar datos incluso si hay error para sincronizar
        this.cargarDatos();
      }
    });
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

  // Obtener color del estado
  getEstadoColor(estado: string): string {
    return this.cursoEstadosService.getColorEstado(estado);
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

  // Exportar cursos a PDF
  exportarCursosPDF(): void {
    const periodoParam = this.periodoFiltro && this.periodoFiltro !== 'todos' && this.periodoFiltro.trim() !== '' 
      ? this.periodoFiltro.trim() 
      : undefined;
    
    
    this.cursosService.exportarCursosPDF(periodoParam).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        descargarBlob(result.blob, result.filename);
        this.snackBar.open('PDF exportado correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
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
        
        this.snackBar.open(mensajeError, 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }
}
