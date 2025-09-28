import { Component, Inject } from '@angular/core';
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
import { CursosIntersemestralesService, CreateCursoDTO, UpdateCursoDTO } from '../../../../core/services/cursos-intersemestrales.service';

export interface CursoDialogData {
  form: FormGroup;
  editando: boolean;
  titulo: string;
  cursoEditando?: any;
  materias?: any[];
  docentes?: any[];
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
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    
    <form [formGroup]="data.form" (ngSubmit)="guardarCurso()">
      <div mat-dialog-content class="form-container">
        
        <!-- Información básica -->
        <div class="form-section">
          <h3>Información Básica</h3>
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Nombre del Curso</mat-label>
            <input matInput formControlName="nombre_curso" placeholder="Ej: Programación Avanzada">
            <mat-error *ngIf="data.form.get('nombre_curso')?.hasError('required')">
              El nombre del curso es requerido
            </mat-error>
            <mat-error *ngIf="data.form.get('nombre_curso')?.hasError('minlength')">
              El nombre debe tener al menos 3 caracteres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Código del Curso</mat-label>
            <input matInput formControlName="codigo_curso" placeholder="Ej: PROG-301">
            <mat-error *ngIf="data.form.get('codigo_curso')?.hasError('required')">
              El código del curso es requerido
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field full-width">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="descripcion" rows="3" placeholder="Describe el contenido del curso"></textarea>
            <mat-error *ngIf="data.form.get('descripcion')?.hasError('required')">
              La descripción es requerida
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Materia</mat-label>
            <mat-select formControlName="id_materia">
              <mat-option *ngFor="let materia of data.materias" [value]="materia.id_materia">
                {{ materia.nombre_materia }} ({{ materia.codigo_materia }}) - {{ materia.creditos }} créditos
              </mat-option>
            </mat-select>
            <mat-error *ngIf="data.form.get('id_materia')?.hasError('required')">
              La materia es requerida
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Docente</mat-label>
            <mat-select formControlName="id_docente">
              <mat-option *ngFor="let docente of data.docentes" [value]="docente.id_usuario">
                {{ docente.nombre }} {{ docente.apellido }} - {{ docente.email }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="data.form.get('id_docente')?.hasError('required')">
              El docente es requerido
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Fechas y cupos -->
        <div class="form-section">
          <h3>Fechas y Cupos</h3>
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Fecha de Inicio</mat-label>
            <input matInput [matDatepicker]="pickerInicio" formControlName="fecha_inicio" placeholder="Selecciona la fecha de inicio">
            <mat-datepicker-toggle matIconSuffix [for]="pickerInicio"></mat-datepicker-toggle>
            <mat-datepicker #pickerInicio></mat-datepicker>
            <mat-error *ngIf="data.form.get('fecha_inicio')?.hasError('required')">
              La fecha de inicio es requerida
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Fecha de Fin</mat-label>
            <input matInput [matDatepicker]="pickerFin" formControlName="fecha_fin" placeholder="Selecciona la fecha de fin">
            <mat-datepicker-toggle matIconSuffix [for]="pickerFin"></mat-datepicker-toggle>
            <mat-datepicker #pickerFin></mat-datepicker>
            <mat-error *ngIf="data.form.get('fecha_fin')?.hasError('required')">
              La fecha de fin es requerida
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Cupo Máximo</mat-label>
            <input matInput type="number" formControlName="cupo_maximo" min="1" max="100">
            <mat-error *ngIf="data.form.get('cupo_maximo')?.hasError('required')">
              El cupo máximo es requerido
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Cupo Estimado</mat-label>
            <input matInput type="number" formControlName="cupo_estimado" min="1" max="100">
            <mat-error *ngIf="data.form.get('cupo_estimado')?.hasError('required')">
              El cupo estimado es requerido
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Configuración -->
        <div class="form-section">
          <h3>Configuración</h3>
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Espacio Asignado</mat-label>
            <input matInput formControlName="espacio_asignado" placeholder="Ej: Lab 301, Aula 205">
            <mat-error *ngIf="data.form.get('espacio_asignado')?.hasError('required')">
              El espacio asignado es requerido
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              <mat-option value="Abierto">Abierto</mat-option>
              <mat-option value="Publicado">Publicado</mat-option>
              <mat-option value="Preinscripcion">Preinscripción</mat-option>
              <mat-option value="Inscripcion">Inscripción</mat-option>
              <mat-option value="Cerrado">Cerrado</mat-option>
            </mat-select>
            <mat-error *ngIf="data.form.get('estado')?.hasError('required')">
              El estado es requerido
            </mat-error>
          </mat-form-field>
        </div>

      </div>

      <!-- Botones del dialog -->
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button type="button" (click)="limpiarFormulario()">
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
      content: "📋";
      font-size: 20px;
      flex-shrink: 0;
    }

    .form-section:nth-child(2) h3::before {
      content: "📅";
    }

    .form-section:nth-child(3) h3::before {
      content: "⚙️";
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
  `]
})
export class CursoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CursoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CursoDialogData,
    private cursosService: CursosIntersemestralesService,
    private snackBar: MatSnackBar
  ) {}

  guardarCurso() {
    if (this.data.form.valid) {
      const formData = this.data.form.value;
      
      if (this.data.editando && this.data.cursoEditando) {
        // Actualizar curso existente
        const updateData: UpdateCursoDTO = {
          ...formData,
          fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : undefined,
          fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : undefined
        };
        
        this.cursosService.actualizarCurso(this.data.cursoEditando.id_curso, updateData)
          .subscribe({
            next: (cursoActualizado) => {
              console.log('✅ Curso actualizado:', cursoActualizado);
              this.snackBar.open('Curso actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.dialogRef.close('guardado');
            },
            error: (err) => {
              console.error('❌ Error actualizando curso:', err);
              this.snackBar.open('Error al actualizar el curso', 'Cerrar', { duration: 3000 });
              // Cerrar dialog incluso si hay error para que se actualice la lista
              this.dialogRef.close('guardado');
            }
          });
      } else {
        // Crear nuevo curso
        const createData: CreateCursoDTO = {
          ...formData,
          fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : '',
          fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : ''
        };
        
        this.cursosService.crearCurso(createData)
          .subscribe({
            next: (nuevoCurso) => {
              console.log('✅ Curso creado:', nuevoCurso);
              this.snackBar.open('Curso creado exitosamente', 'Cerrar', { duration: 3000 });
              this.dialogRef.close('guardado');
            },
            error: (err) => {
              console.error('❌ Error creando curso:', err);
              this.snackBar.open('Error al crear el curso', 'Cerrar', { duration: 3000 });
              // Cerrar dialog incluso si hay error para que se actualice la lista
              this.dialogRef.close('guardado');
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
      cupo_maximo: 25,
      cupo_estimado: 25
    });
  }

  cerrarDialog() {
    this.dialogRef.close();
  }
}
