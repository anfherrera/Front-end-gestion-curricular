import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

export interface DocumentTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  camposRequeridos: string[];
  camposOpcionales?: string[];
}

export interface DocumentData {
  numeroDocumento: string;
  fechaDocumento: Date;
  observaciones?: string;
  [key: string]: any; // Para campos adicionales específicos del proceso
}

export interface DocumentRequest {
  idSolicitud: number;
  tipoDocumento: string;
  datosDocumento: DocumentData;
  datosSolicitud: any; // Datos de la solicitud (estudiante, programa, etc.)
}

@Component({
  selector: 'app-document-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './document-generator.component.html',
  styleUrls: ['./document-generator.component.css']
})
export class DocumentGeneratorComponent implements OnInit {
  @Input() solicitud!: any; // Datos de la solicitud
  @Input() template!: DocumentTemplate; // Plantilla del documento
  @Input() proceso!: string; // Tipo de proceso (homologacion, paz-salvo, etc.)
  @Input() loading: boolean = false;
  @Input() mostrarObservaciones: boolean = true;

  @Output() generarDocumento = new EventEmitter<DocumentRequest>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() tengoDocumento = new EventEmitter<void>();

  documentForm!: FormGroup;
  datosSolicitud: any = {};

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.prepareSolicitudData();
  }

  private initializeForm(): void {
    const formControls: any = {
      numeroDocumento: ['', [Validators.required, Validators.minLength(1)]],
      fechaDocumento: [new Date().toISOString().split('T')[0], Validators.required]
    };

    // Agregar campos opcionales si existen
    if (this.template.camposOpcionales) {
      this.template.camposOpcionales.forEach(campo => {
        if (campo === 'observaciones' && !this.mostrarObservaciones) {
          return;
        }
        formControls[campo] = [''];
      });
    }

    this.documentForm = this.fb.group(formControls);

    // Formulario inicializado
  }

  private prepareSolicitudData(): void {
    // Solicitud recibida

    // Obtener el estado actual de la solicitud
    let estadoActual = this.solicitud.estado;
    
    // Si no hay estado directo, intentar obtenerlo de estadosSolicitud (para Paz y Salvo)
    if (!estadoActual && this.solicitud.estadosSolicitud && this.solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = this.solicitud.estadosSolicitud[this.solicitud.estadosSolicitud.length - 1];
      estadoActual = ultimoEstado.estado_actual;
      // Estado obtenido de estadosSolicitud
    }

    // Extraer datos relevantes de la solicitud según el proceso
    this.datosSolicitud = {
      idSolicitud: this.solicitud.id || this.solicitud.id_solicitud,
      nombreEstudiante: this.solicitud.usuario?.nombre_completo || this.solicitud.objUsuario?.nombre_completo,
      codigoEstudiante: this.solicitud.usuario?.codigo || this.solicitud.objUsuario?.codigo,
      programa: this.solicitud.usuario?.objPrograma?.nombre_programa || this.solicitud.objUsuario?.objPrograma?.nombre_programa,
      fechaSolicitud: this.solicitud.fecha || this.solicitud.fecha_registro_solicitud,
      estado: estadoActual || 'Pendiente'
    };

    // Datos de solicitud preparados
  }

  onSubmit(): void {
    // Formulario válido

    if (this.documentForm.valid) {
      const formData = this.documentForm.value;

      // FormData extraído

      const documentRequest: DocumentRequest = {
        idSolicitud: this.datosSolicitud.idSolicitud,
        tipoDocumento: this.template.id,
        datosDocumento: {
          numeroDocumento: formData.numeroDocumento,
          fechaDocumento: formData.fechaDocumento,
          ...(this.mostrarObservaciones ? { observaciones: formData.observaciones || '' } : {}),
          // Agregar campos adicionales específicos del proceso
          ...this.getAdditionalFields(formData)
        },
        datosSolicitud: this.datosSolicitud
      };

      // DocumentRequest creado
      this.generarDocumento.emit(documentRequest);
    } else {
      // Formulario inválido, marcando campos como tocados
      this.markFormGroupTouched();
    }
  }

  private getAdditionalFields(formData: any): any {
    const additionalFields: any = {};

    // Agregar campos específicos según el proceso
    if (this.proceso === 'homologacion') {
      additionalFields.tipoHomologacion = 'ASIGNATURAS';
      additionalFields.asignaturasHomologadas = this.solicitud.asignaturas || [];
    } else if (this.proceso === 'paz-salvo') {
      additionalFields.tipoPazSalvo = 'ACADEMICO';
      additionalFields.semestre = this.solicitud.semestre || '';
    } else if (this.proceso === 'reingreso') {
      additionalFields.motivoReingreso = this.solicitud.motivo || '';
      additionalFields.semestreAnterior = this.solicitud.semestreAnterior || '';
    }

    // Agregar campos opcionales del formulario
    if (this.template.camposOpcionales) {
      this.template.camposOpcionales.forEach(campo => {
        if (campo === 'observaciones' && !this.mostrarObservaciones) {
          return;
        }
        if (formData[campo]) {
          additionalFields[campo] = formData[campo];
        }
      });
    }

    return additionalFields;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.documentForm.controls).forEach(key => {
      const control = this.documentForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.cancelar.emit();
  }

  getFieldError(fieldName: string): string {
    const control = this.documentForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      numeroDocumento: 'Número de documento',
      fechaDocumento: 'Fecha del documento',
      observaciones: 'Observaciones'
    };
    return labels[fieldName] || fieldName;
  }

  hasError(fieldName: string): boolean {
    const control = this.documentForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  getTemplateIcon(): string {
    const icons: { [key: string]: string } = {
      'OFICIO_HOMOLOGACION': 'description',
      'PAZ_SALVO': 'verified_user',
      'RESOLUCION_REINGRESO': 'assignment_turned_in'
    };
    return icons[this.template.id] || 'description';
  }

  getFieldPlaceholder(fieldName: string): string {
    const placeholders: { [key: string]: string } = {
      'observaciones': 'Observaciones adicionales...',
      'semestre': 'Ej: 2024-1',
      'motivoReingreso': 'Motivo del reingreso...'
    };
    return placeholders[fieldName] || '';
  }

  getFieldIcon(fieldName: string): string {
    const icons: { [key: string]: string } = {
      'observaciones': 'note',
      'semestre': 'calendar_today',
      'motivoReingreso': 'help_outline'
    };
    return icons[fieldName] || 'info';
  }

  /**
   * Maneja el clic en "Tengo un documento"
   */
  onTengoDocumento(): void {
    this.tengoDocumento.emit();
  }
}
