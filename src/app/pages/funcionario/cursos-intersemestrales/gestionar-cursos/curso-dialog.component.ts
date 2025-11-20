import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CursosIntersemestralesService, CreateCursoDTO, UpdateCursoDTO } from '../../../../core/services/cursos-intersemestrales.service';
import { formatearPeriodo, validarFechasCurso, calcularDuracionSemanas, ordenarPeriodos, validarPeriodo } from '../../../../core/utils/periodo.utils';

export interface CursoDialogData {
  form: FormGroup;
  editando: boolean;
  titulo: string;
  cursoEditando?: any;
  materias?: any[];
  docentes?: any[];
  soloEdicion?: boolean; // Flag para modo de solo edición
}

@Component({
  selector: 'app-curso-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    
    <form [formGroup]="data.form" (ngSubmit)="guardarCurso()">
      <div mat-dialog-content class="form-container">
        
        <!-- Información básica (solo para crear) -->
        <div class="form-section" *ngIf="!data.soloEdicion">
          <h3>Información Básica</h3>
          
          <!-- NOTA: nombre_curso, codigo_curso y descripcion se obtienen automáticamente de la materia seleccionada -->
          <!-- Estos campos NO se muestran porque el backend los genera automáticamente -->
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Materia</mat-label>
            <mat-select formControlName="id_materia">
              <mat-option *ngFor="let materia of data.materias" [value]="materia.id_materia">
                {{ materia.nombre || materia.nombre_materia }} ({{ materia.codigo || materia.codigo_materia }}) - {{ materia.creditos }} créditos
              </mat-option>
            </mat-select>
            <mat-error *ngIf="data.form.get('id_materia')?.hasError('required')">
              La materia es requerida
            </mat-error>
            <mat-hint>El nombre y código del curso se obtendrán automáticamente de la materia seleccionada</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Docente</mat-label>
            <mat-select formControlName="id_docente" (selectionChange)="onDocenteSelected($event)">
              <mat-option *ngFor="let docente of data.docentes" [value]="docente.id_docente || docente.id_usuario">
                {{ docente.nombre }} {{ docente.apellido }} ({{ docente.codigo_usuario }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="data.form.get('id_docente')?.hasError('required')">
              El docente es requerido
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Información del curso (solo para edición) -->
        <div class="form-section" *ngIf="data.soloEdicion && data.cursoEditando">
          <h3>Información del Curso</h3>
          <div class="info-display">
            <div class="info-item">
              <strong>Nombre:</strong> {{ data.cursoEditando.nombre_curso }}
            </div>
            <div class="info-item">
              <strong>Código:</strong> {{ data.cursoEditando.codigo_curso }}
            </div>
            <div class="info-item">
              <strong>Materia:</strong> {{ data.cursoEditando.objMateria?.nombre }} ({{ data.cursoEditando.objMateria?.codigo }})
            </div>
            <div class="info-item">
              <strong>Docente:</strong> {{ obtenerNombreDocente(data.cursoEditando) }}
            </div>
            <div class="info-item" *ngIf="data.cursoEditando.grupo">
              <strong>Grupo:</strong> {{ data.cursoEditando.grupo }}
            </div>
          </div>
        </div>

        <!-- Fechas y cupos (solo para crear) -->
        <div class="form-section" *ngIf="!data.soloEdicion">
          <h3>Período y Fechas</h3>
          
          <!-- Período Académico -->
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Período Académico</mat-label>
            <mat-select formControlName="periodoAcademico">
              <mat-option *ngFor="let periodo of periodos" [value]="periodo">
                {{ formatearPeriodo(periodo) }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="data.form.get('periodoAcademico')?.hasError('required')">
              El período académico es requerido
            </mat-error>
            <mat-hint>Selecciona un período académico válido del listado</mat-hint>
          </mat-form-field>

          <!-- Grupo -->
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Grupo</mat-label>
            <mat-select formControlName="grupo">
              <mat-option value="A">Grupo A</mat-option>
              <mat-option value="B">Grupo B</mat-option>
              <mat-option value="C">Grupo C</mat-option>
              <mat-option value="D">Grupo D</mat-option>
            </mat-select>
            <mat-hint>Opcional. Puedes crear múltiples grupos (A, B, C, D) de la misma materia. Si no se selecciona, se asignará "A" por defecto.</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Fecha de Inicio</mat-label>
            <input matInput [matDatepicker]="pickerInicio" formControlName="fecha_inicio" placeholder="Selecciona la fecha de inicio" (dateChange)="onFechaChange()">
            <mat-datepicker-toggle matIconSuffix [for]="pickerInicio"></mat-datepicker-toggle>
            <mat-datepicker #pickerInicio></mat-datepicker>
            <mat-error *ngIf="data.form.get('fecha_inicio')?.hasError('required')">
              La fecha de inicio es requerida
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Fecha de Fin</mat-label>
            <input matInput [matDatepicker]="pickerFin" formControlName="fecha_fin" placeholder="Selecciona la fecha de fin" (dateChange)="onFechaChange()">
            <mat-datepicker-toggle matIconSuffix [for]="pickerFin"></mat-datepicker-toggle>
            <mat-datepicker #pickerFin></mat-datepicker>
            <mat-error *ngIf="data.form.get('fecha_fin')?.hasError('required')">
              La fecha de fin es requerida
            </mat-error>
            <mat-error *ngIf="errorFechas">
              {{ errorFechas }}
            </mat-error>
          </mat-form-field>

          <!-- Información de duración -->
          <div class="duracion-info" *ngIf="mostrarDuracion">
            <mat-icon>schedule</mat-icon>
            <span>Duración: <strong>{{ duracionSemanas }} {{ duracionSemanas === 1 ? 'semana' : 'semanas' }}</strong></span>
          </div>

          <!-- NOTA: cupo_maximo se calcula automáticamente igual a cupo_estimado -->
          <!-- Este campo NO se muestra porque el backend lo calcula automáticamente -->

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Cupo Estimado</mat-label>
            <input matInput type="number" formControlName="cupo_estimado" min="1" max="100">
            <mat-error *ngIf="data.form.get('cupo_estimado')?.hasError('required')">
              El cupo estimado es requerido
            </mat-error>
            <mat-error *ngIf="data.form.get('cupo_estimado')?.hasError('min')">
              El cupo debe ser mayor a 0
            </mat-error>
            <mat-error *ngIf="data.form.get('cupo_estimado')?.hasError('max')">
              El cupo no puede ser mayor a 100
            </mat-error>
            <mat-hint>El cupo máximo será igual al cupo estimado</mat-hint>
          </mat-form-field>
        </div>

        <!-- Configuración editable -->
        <div class="form-section">
          <h3>{{ data.soloEdicion ? 'Configuración Editable' : 'Configuración' }}</h3>
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Espacio Asignado</mat-label>
            <input matInput formControlName="espacio_asignado" placeholder="Ej: Lab 301, Aula 205">
            <mat-error *ngIf="data.form.get('espacio_asignado')?.hasError('minlength')">
              El espacio debe tener al menos 3 caracteres
            </mat-error>
            <mat-hint>Opcional. Si no se especifica, se asignará "Aula 101" por defecto</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              <mat-option value="Borrador">Borrador</mat-option>
              <mat-option value="Abierto">Abierto</mat-option>
              <mat-option value="Publicado">Publicado</mat-option>
              <mat-option value="Preinscripción">Preinscripción</mat-option>
              <mat-option value="Inscripción">Inscripción</mat-option>
              <mat-option value="Cerrado">Cerrado</mat-option>
            </mat-select>
            <mat-hint>Opcional. Si no se selecciona, se asignará "Abierto" por defecto</mat-hint>
          </mat-form-field>
        </div>

      </div>

      <!-- Botones del dialog -->
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button type="button" (click)="limpiarFormulario()" *ngIf="!data.soloEdicion">
          Limpiar
        </button>
        <button mat-button type="button" (click)="cerrarDialog()">
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="data.form.invalid">
          {{ data.editando ? 'Actualizar' : 'Crear' }} Curso
        </button>
      </div>
    </form>
  `,
  styles: [`
    /* Contenedor principal del formulario */
    .form-container {
      max-height: 60vh;
      overflow-y: auto;
      padding: 20px 0;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
      margin: 0 -24px;
      padding: 20px 24px;
    }

    /* Secciones del formulario */
    .form-section {
      margin-bottom: 32px;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 19, 140, 0.1);
      border: 1px solid #e3f2fd;
    }

    .form-section h3 {
      color: #00138C;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
      border-bottom: 3px solid #00138C;
      padding-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .form-section h3::before {
      content: "";
      font-size: 20px;
      flex-shrink: 0;
    }

    .form-section:nth-child(2) h3::before {
      content: "📅";
    }

    .form-section:nth-child(3) h3::before {
      content: "";
    }

    /* Campos del formulario */
    .form-field {
      width: 100%;
      margin-bottom: 20px;
    }

    .form-field.full-width {
      width: 100%;
    }

    /* Estilos para mat-form-field */
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper {
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-focus-overlay {
      background-color: rgba(0, 19, 140, 0.04);
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {
      background-color: rgba(0, 19, 140, 0.08);
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-outline {
      color: #e3f2fd;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline {
      color: #00138C;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-label {
      color: #6c757d;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label {
      color: #00138C;
    }

    /* Estilos para date picker */
    ::ng-deep .mat-datepicker-toggle {
      color: #00138C !important;
    }

    ::ng-deep .mat-datepicker-toggle:hover {
      color: #001a99 !important;
    }

    ::ng-deep .mat-datepicker-content {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 19, 140, 0.2);
    }

    ::ng-deep .mat-calendar-header {
      background-color: #00138C;
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-arrow {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-period-button {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-period-button .mat-button-wrapper {
      color: white !important;
    }

    /* Forzar color blanco en todo el header del calendario */
    ::ng-deep .mat-calendar-header * {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-arrow {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-period-button {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-period-button .mat-button-wrapper {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-period-button .mat-button-wrapper * {
      color: white !important;
    }

    /* Estilos para el selector de mes y año */
    ::ng-deep .mat-calendar-table {
      background-color: white;
    }

    ::ng-deep .mat-calendar-body-cell {
      color: #333 !important;
    }

    ::ng-deep .mat-calendar-body-cell:hover:not(.mat-calendar-body-disabled) {
      background-color: rgba(0, 19, 140, 0.1) !important;
      color: #00138C !important;
    }

    ::ng-deep .mat-calendar-body-selected {
      background-color: #00138C !important;
      color: white !important;
    }

    ::ng-deep .mat-calendar-body-today:not(.mat-calendar-body-selected) {
      border-color: #00138C !important;
      color: #00138C !important;
    }

    /* Estilos para el panel de selección de mes/año */
    ::ng-deep .mat-calendar-table-header th {
      background-color: #f8f9fa !important;
      color: #00138C !important;
      font-weight: 600 !important;
    }

    /* Estilos para los botones de navegación del calendario */
    ::ng-deep .mat-calendar-header .mat-calendar-previous-button,
    ::ng-deep .mat-calendar-header .mat-calendar-next-button {
      color: white !important;
    }

    ::ng-deep .mat-calendar-header .mat-calendar-previous-button:hover,
    ::ng-deep .mat-calendar-header .mat-calendar-next-button:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }

    /* Estilos para el panel de selección de mes/año (cuando haces clic en el header) */
    ::ng-deep .mat-calendar-table .mat-calendar-body-cell {
      color: #333 !important;
    }

    ::ng-deep .mat-calendar-table .mat-calendar-body-cell:hover {
      background-color: rgba(0, 19, 140, 0.1) !important;
      color: #00138C !important;
    }

    ::ng-deep .mat-calendar-table .mat-calendar-body-selected {
      background-color: #00138C !important;
      color: white !important;
    }

    /* Estilos para el contenido del calendario cuando está en modo selección de mes/año */
    ::ng-deep .mat-calendar-content {
      background-color: white;
    }

    ::ng-deep .mat-calendar-content .mat-calendar-body-cell {
      color: #333 !important;
    }

    ::ng-deep .mat-calendar-content .mat-calendar-body-cell:hover {
      background-color: rgba(0, 19, 140, 0.1) !important;
      color: #00138C !important;
    }

    ::ng-deep .mat-calendar-content .mat-calendar-body-selected {
      background-color: #00138C !important;
      color: white !important;
    }

    ::ng-deep .mat-calendar-table-header {
      background-color: #f8f9fa;
      color: #00138C;
      font-weight: 600;
    }

    ::ng-deep .mat-calendar-body-selected {
      background-color: #00138C !important;
      color: white !important;
    }

    ::ng-deep .mat-calendar-body-today:not(.mat-calendar-body-selected) {
      border-color: #00138C !important;
    }

    ::ng-deep .mat-calendar-body-cell:hover:not(.mat-calendar-body-disabled) {
      background-color: rgba(0, 19, 140, 0.1) !important;
    }

    /* Botones del dialog */
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px 0;
      border-top: 2px solid #e3f2fd;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      margin: 0 -24px;
      padding: 24px;
      border-radius: 0 0 8px 8px;
    }

    .dialog-actions button {
      min-width: 120px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .dialog-actions button[color="primary"] {
      background: linear-gradient(135deg, #00138C 0%, #001a99 100%) !important;
      color: white !important;
      border: none !important;
    }

    .dialog-actions button[color="primary"]:hover {
      background: linear-gradient(135deg, #001a99 0%, #0022b3 100%) !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 19, 140, 0.3);
    }

    .dialog-actions button:not([color="primary"]) {
      background: white !important;
      color: #00138C !important;
      border: 2px solid #00138C !important;
    }

    .dialog-actions button:not([color="primary"]):hover {
      background: #00138C !important;
      color: white !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 19, 140, 0.2);
    }

    /* Título del dialog */
    ::ng-deep .mat-mdc-dialog-title {
      background: linear-gradient(135deg, #00138C 0%, #001a99 100%);
      color: white !important;
      padding: 20px 24px;
      margin: -24px -24px 0 -24px;
      border-radius: 8px 8px 0 0;
      font-size: 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 12px;
    }


    /* Contenido del dialog */
    ::ng-deep .mat-mdc-dialog-content {
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-container {
        max-height: 50vh;
        padding: 16px;
      }
      
      .form-section {
        padding: 16px;
        margin-bottom: 20px;
      }
      
      .form-section h3 {
        font-size: 16px;
        margin-bottom: 16px;
      }
      
      .dialog-actions {
        flex-direction: column;
        gap: 8px;
        padding: 16px;
      }
      
      .dialog-actions button {
        width: 100%;
        min-width: auto;
      }
    }

    /* Animaciones */
    .form-section {
      animation: slideInUp 0.3s ease-out;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Scroll personalizado */
    .form-container::-webkit-scrollbar {
      width: 8px;
    }

    .form-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .form-container::-webkit-scrollbar-thumb {
      background: #00138C;
      border-radius: 4px;
    }

    .form-container::-webkit-scrollbar-thumb:hover {
      background: #001a99;
    }

    /* Estilos para información de solo lectura */
    .info-display {
      background: #f8f9fa;
      border: 2px solid #e3f2fd;
      border-radius: 8px;
      padding: 20px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e3f2fd;
      font-size: 14px;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item strong {
      color: #00138C;
      min-width: 100px;
      margin-right: 16px;
      font-weight: 600;
    }

    /* Estilos para información de duración */
    .duracion-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-left: 4px solid #00138C;
      border-radius: 8px;
      margin: 16px 0;
      box-shadow: 0 2px 4px rgba(0, 19, 140, 0.1);
    }

    .duracion-info mat-icon {
      color: #00138C;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .duracion-info span {
      color: #00138C;
      font-size: 14px;
    }

    .duracion-info strong {
      font-size: 16px;
      font-weight: 700;
    }
  `]
})
export class CursoDialogComponent implements OnInit {
  // Propiedades para períodos y validación de fechas
  periodos: string[] = [];
  errorFechas: string | null = null;
  duracionSemanas: number = 0;
  mostrarDuracion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CursoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CursoDialogData,
    private cursosService: CursosIntersemestralesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
    
    // Suscribirse a cambios en las fechas para validar
    if (!this.data.soloEdicion) {
      this.data.form.get('fecha_inicio')?.valueChanges.subscribe(() => this.onFechaChange());
      this.data.form.get('fecha_fin')?.valueChanges.subscribe(() => this.onFechaChange());
    }
  }

  // Método para manejar la selección del docente
  onDocenteSelected(event: any): void {
    const selectedId = event.value;
    // Log de depuración (comentado para producción)
    
    // Buscar el docente seleccionado en la lista
    const docenteSeleccionado = this.data.docentes?.find(d => 
      (d.id_docente && d.id_docente === selectedId) || 
      (d.id_usuario && d.id_usuario === selectedId)
    );
    
    if (docenteSeleccionado) {
      // Log de depuración (comentado para producción)
      
      // Asegurarse de que se use id_docente si está disponible
      const idFinal = docenteSeleccionado.id_docente || docenteSeleccionado.id_usuario;
      
      // Actualizar el valor del formulario con el ID correcto
      this.data.form.patchValue({ id_docente: idFinal }, { emitEvent: false });
    } else {
      console.warn('Docente no encontrado en la lista con ID:', selectedId);
    }
  }

  // Obtener nombre del docente de forma segura (maneja diferentes estructuras del backend)
  obtenerNombreDocente(curso: any): string {
    if (!curso || !curso.objDocente) {
      return 'Sin asignar';
    }
    
    const docente = curso.objDocente;
    
    // Priorizar nombre_docente (estructura del backend)
    if ((docente as any).nombre_docente) {
      return (docente as any).nombre_docente;
    }
    
    // Fallback a nombre y apellido (estructura legacy)
    if (docente.nombre && docente.apellido) {
      return `${docente.nombre} ${docente.apellido}`;
    }
    
    if (docente.nombre) {
      return docente.nombre;
    }
    
    // Si tiene nombre_completo
    if ((docente as any).nombre_completo) {
      return (docente as any).nombre_completo;
    }
    
    return 'Sin nombre';
  }

  // Cargar períodos académicos (recientes para crear cursos)
  private cargarPeriodos(): void {
    console.log('🔄 Cargando períodos académicos recientes...');
    
    // Usar períodos recientes para crear cursos nuevos (recomendado según especificación)
    this.cursosService.getPeriodosRecientes().subscribe({
      next: (periodos) => {
        this.periodos = ordenarPeriodos(periodos, 'asc'); // Orden cronológico
        // Períodos recientes cargados
        
        // Si hay períodos disponibles, pre-seleccionar el primer período futuro
        if (this.periodos.length > 0 && !this.data.editando) {
          const primerPeriodo = this.periodos[0];
          this.data.form.patchValue({ periodoAcademico: primerPeriodo });
          // Período pre-seleccionado
        }
      },
      error: (error) => {
        console.error('Error cargando períodos recientes:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        
        // Si falla, intentar con períodos futuros como fallback
        console.warn('Intentando cargar períodos futuros como fallback...');
        this.cargarPeriodosFuturosFallback();
      }
    });
  }

  // Método de fallback para cargar períodos futuros
  private cargarPeriodosFuturosFallback(): void {
    this.cursosService.getPeriodosFuturos().subscribe({
      next: (periodos) => {
        this.periodos = ordenarPeriodos(periodos, 'asc'); // Orden cronológico
        // Períodos futuros cargados (fallback)
        
        if (this.periodos.length > 0 && !this.data.editando) {
          const primerPeriodo = this.periodos[0];
          this.data.form.patchValue({ periodoAcademico: primerPeriodo });
        }
      },
      error: (error) => {
        console.error('Error cargando períodos futuros (fallback):', error);
        // Si falla, intentar con todos los períodos como último recurso
        console.warn('Intentando cargar TODOS los períodos como último recurso...');
        this.cargarTodosLosPeriodos();
      }
    });
  }

  // Método de fallback para cargar todos los períodos
  private cargarTodosLosPeriodos(): void {
    this.cursosService.getPeriodosAcademicos().subscribe({
      next: (periodos) => {
        this.periodos = ordenarPeriodos(periodos, 'desc'); // Más recientes primero
        // Todos los períodos cargados (fallback)
        
        if (this.periodos.length > 0 && !this.data.editando) {
          const primerPeriodo = this.periodos[0];
          this.data.form.patchValue({ periodoAcademico: primerPeriodo });
        }
      },
      error: (error) => {
        console.error('Error crítico cargando períodos:', error);
        this.snackBar.open('No se pudieron cargar los períodos académicos. Verifica la conexión con el backend.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Formatear período para visualización
  formatearPeriodo(periodo: string): string {
    return formatearPeriodo(periodo);
  }

  // Validar fechas al cambiar
  onFechaChange(): void {
    const fechaInicio = this.data.form.get('fecha_inicio')?.value;
    const fechaFin = this.data.form.get('fecha_fin')?.value;

    if (fechaInicio && fechaFin) {
      // Validar fechas
      this.errorFechas = validarFechasCurso(fechaInicio, fechaFin);
      
      // Calcular duración
      if (!this.errorFechas) {
        this.duracionSemanas = calcularDuracionSemanas(fechaInicio, fechaFin);
        this.mostrarDuracion = true;
      } else {
        this.mostrarDuracion = false;
      }
    } else {
      this.errorFechas = null;
      this.mostrarDuracion = false;
    }
  }

  guardarCurso() {
    if (this.data.form.valid) {
      const formData = this.data.form.value;
      
      if (this.data.editando && this.data.cursoEditando) {
        // Actualizar curso existente (solo campos editables)
        const updateData: UpdateCursoDTO = {
          cupo_estimado: formData.cupo_estimado,
          espacio_asignado: formData.espacio_asignado,
          estado: formData.estado
        };
        
        // Log de depuración (comentado para producción)
        
        // Función de prueba para verificar el endpoint
        // Función de prueba para verificar el endpoint (comentado para producción)
        
        this.cursosService.actualizarCurso(this.data.cursoEditando.id_curso, updateData)
          .subscribe({
            next: (cursoActualizado) => {
              // Curso actualizado
              this.snackBar.open('Curso actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.dialogRef.close('guardado');
            },
            error: (err) => {
              console.error('Error actualizando curso:', err);
              console.error('Detalles del error:', {
                status: err.status,
                statusText: err.statusText,
                url: err.url,
                error: err.error,
                message: err.message
              });
              
              // Mostrar mensaje de error más específico
              let errorMessage = 'Error al actualizar el curso';
              if (err.error && err.error.message) {
                errorMessage = err.error.message;
              } else if (err.error && typeof err.error === 'string') {
                errorMessage = err.error;
              } else if (err.status === 400) {
                errorMessage = 'Datos inválidos enviados al servidor';
              }
              
              this.snackBar.open(`${errorMessage}`, 'Cerrar', { 
                duration: 5000, 
                panelClass: ['error-snackbar'] 
              });
              // Cerrar dialog incluso si hay error para que se actualice la lista
              this.dialogRef.close('guardado');
            }
          });
      } else {
        // Crear nuevo curso
        const formValue = this.data.form.value;
        
        // Verificar y corregir el id_docente antes de enviar
        let idDocenteFinal = formValue.id_docente;
        
        // Si el id_docente es un número pero parece ser un índice, buscar el docente correcto
        if (idDocenteFinal && this.data.docentes) {
          const docenteSeleccionado = this.data.docentes.find(d => 
            (d.id_docente && d.id_docente === idDocenteFinal) || 
            (d.id_usuario && d.id_usuario === idDocenteFinal)
          );
          
          if (docenteSeleccionado) {
            // Usar id_docente si está disponible, sino id_usuario
            idDocenteFinal = docenteSeleccionado.id_docente || docenteSeleccionado.id_usuario;
            // ID docente corregido
          }
        }
        
        // Validar formato del período académico antes de enviar
        const periodoAcademico = formValue.periodoAcademico || '';
        if (!validarPeriodo(periodoAcademico)) {
          this.snackBar.open('El período académico seleccionado no tiene un formato válido. Por favor, selecciona un período del listado.', 'Cerrar', { 
            duration: 5000, 
            panelClass: ['error-snackbar'] 
          });
          return;
        }
        
        // Construir payload SOLO con los campos que el backend espera
        // El backend NO espera: nombre_curso, codigo_curso, descripcion, cupo_maximo
        const createData: CreateCursoDTO = {
          id_materia: Number(formValue.id_materia),
          id_docente: Number(idDocenteFinal), // Asegurar que se use el ID correcto y sea número
          cupo_estimado: Number(formValue.cupo_estimado),
          fecha_inicio: formValue.fecha_inicio ? new Date(formValue.fecha_inicio).toISOString() : '',
          fecha_fin: formValue.fecha_fin ? new Date(formValue.fecha_fin).toISOString() : '',
          periodoAcademico: periodoAcademico
        };
        
        // Campos opcionales (solo incluir si tienen valor)
        if (formValue.espacio_asignado) {
          createData.espacio_asignado = formValue.espacio_asignado;
        }
        
        if (formValue.estado) {
          createData.estado = formValue.estado;
        }
        
        // Campo grupo (opcional, se valida en el backend)
        // Siempre incluir el grupo, incluso si es "A" (valor por defecto)
        const grupoValue = formValue.grupo || 'A';
        const grupoUpper = String(grupoValue).toUpperCase().trim();
        if (['A', 'B', 'C', 'D'].includes(grupoUpper)) {
          createData.grupo = grupoUpper;
        } else {
          // Si no es válido, usar "A" por defecto
          createData.grupo = 'A';
        }
        
        // Logs de depuración (comentados para producción)
        
        this.cursosService.crearCurso(createData)
          .subscribe({
            next: (nuevoCurso) => {
              // Curso creado
              this.snackBar.open('Curso creado exitosamente', 'Cerrar', { duration: 3000 });
              this.dialogRef.close('guardado');
            },
            error: (err) => {
              console.error('Error creando curso:', err);
              console.error('Payload enviado:', createData);
              
              // Manejo específico de errores
              let errorMessage = 'Error al crear el curso';
              
              if (err.status === 400 && err.error) {
                // Error de validación del backend
                if (err.error.codigo === 'CURSO_DUPLICADO' || (err.error.message && err.error.message.includes('duplicado'))) {
                  // Error específico de curso duplicado
                  errorMessage = err.error.message || 'Ya existe un curso con la misma materia, docente, período académico y grupo.';
                  errorMessage += '\n\nPuedes crear grupos diferentes (A, B, C, D) para la misma materia y docente.';
                } else if (err.error.message && err.error.message.includes('período académico')) {
                  // Error específico de período académico inválido
                  errorMessage = err.error.message;
                  
                  // Si el backend proporciona la lista de períodos válidos, mostrarla
                  if (err.error.periodosValidos && Array.isArray(err.error.periodosValidos)) {
                    const periodosValidos = err.error.periodosValidos.join(', ');
                    errorMessage += `\n\nPeríodos válidos: ${periodosValidos}`;
                  }
                  
                  // Recargar períodos en caso de error
                  this.cargarPeriodos();
                } else if (err.error.message) {
                  errorMessage = err.error.message;
                } else if (typeof err.error === 'string') {
                  errorMessage = err.error;
                } else if (err.error.error) {
                  errorMessage = err.error.error;
                }
              } else if (err.status === 400) {
                errorMessage = 'Datos inválidos enviados al servidor. Verifica que todos los campos sean correctos.';
              }
              
              this.snackBar.open(`${errorMessage}`, 'Cerrar', { 
                duration: 7000, 
                panelClass: ['error-snackbar'] 
              });
              
              // NO cerrar el dialog si hay error, para que el usuario pueda corregir
            }
          });
      }
    } else {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  limpiarFormulario() {
    this.data.form.reset({
      estado: 'Abierto',
      cupo_estimado: 25,
      grupo: 'A'
    });
  }

  cerrarDialog() {
    this.dialogRef.close();
  }
}
