import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import {
  DatosSolicitudDocumento,
  DocumentRequest,
  DocumentTemplate,
  SolicitudParaDocumento,
} from '@core/models/documento.model';
import { EstadoClasePipe, EstadoIconoPipe, EstadoLabelPipe } from '@shared/pipes/estado.pipes';

@Component({
  selector: 'app-document-generator',
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
    MatDividerModule,
    EstadoClasePipe,
    EstadoIconoPipe,
    EstadoLabelPipe,
  ],
  templateUrl: './document-generator.component.html',
  styleUrls: ['./document-generator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentGeneratorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly solicitud = input.required<SolicitudParaDocumento>(); // Datos de la solicitud
  readonly template = input.required<DocumentTemplate>(); // Plantilla del documento
  readonly proceso = input.required<string>(); // Tipo de proceso (homologacion, paz-salvo, etc.)
  readonly loading = input(false);
  readonly mostrarObservaciones = input(true);

  readonly generarDocumento = output<DocumentRequest>();
  readonly cancelar = output<void>();
  readonly tengoDocumento = output<void>();

  documentForm!: FormGroup;

  /** Datos de la solicitud que se muestran y se envían con el documento. */
  readonly datosSolicitud = computed<DatosSolicitudDocumento>(() => {
    const solicitud = this.solicitud();
    // El estado actual es el último del historial
    const estados = solicitud.estadosSolicitud ?? [];
    const estadoActual = estados.length > 0 ? estados[estados.length - 1].estado_actual : undefined;

    return {
      idSolicitud: solicitud.id_solicitud,
      nombreEstudiante: solicitud.objUsuario?.nombre_completo,
      codigoEstudiante: solicitud.objUsuario?.codigo,
      programa: solicitud.objUsuario?.objPrograma?.nombre_programa,
      fechaSolicitud: solicitud.fecha_registro_solicitud,
      estado: estadoActual || 'Pendiente',
      // Paz y salvo: datos del trabajo de grado, si llegan
      tituloTrabajoGrado: solicitud.titulo_trabajo_grado || undefined,
      directorTrabajoGrado: solicitud.director_trabajo_grado || undefined,
    };
  });

  ngOnInit(): void {
    this.initializeForm();
    // La plantilla lee documentForm.invalid: el popup del datepicker va en un overlay,
    // así que se revisa la vista con cada cambio de estado del formulario.
    this.documentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  private initializeForm(): void {
    const formControls: Record<string, unknown[]> = {
      numeroDocumento: ['', [Validators.required, Validators.minLength(1)]],
      // No inicializar con fecha por defecto - el usuario debe seleccionar la fecha
      // Si no se selecciona, el backend usará la fecha actual
      fechaDocumento: [null, Validators.required],
    };

    // Agregar campos opcionales si existen
    const template = this.template();
    if (template.camposOpcionales) {
      template.camposOpcionales.forEach((campo) => {
        if (campo === 'observaciones' && !this.mostrarObservaciones()) {
          return;
        }
        formControls[campo] = [''];
      });
    }

    this.documentForm = this.fb.group(formControls);

    // Formulario inicializado
  }

  onSubmit(): void {
    // Formulario válido

    if (this.documentForm.valid) {
      const formData = this.documentForm.value;

      // FormData extraído

      const datosSolicitud = this.datosSolicitud();
      const documentRequest: DocumentRequest = {
        idSolicitud: datosSolicitud.idSolicitud,
        tipoDocumento: this.template().id,
        datosDocumento: {
          numeroDocumento: formData.numeroDocumento,
          fechaDocumento: formData.fechaDocumento,
          ...(this.mostrarObservaciones() ? { observaciones: formData.observaciones || '' } : {}),
          // Agregar campos adicionales específicos del proceso
          ...this.getAdditionalFields(formData),
        },
        datosSolicitud,
      };

      // DocumentRequest creado
      this.generarDocumento.emit(documentRequest);
    } else {
      // Formulario inválido, marcando campos como tocados
      this.markFormGroupTouched();
    }
  }

  private getAdditionalFields(formData: Record<string, unknown>): Record<string, unknown> {
    const additionalFields: Record<string, unknown> = {};

    // Agregar campos específicos según el proceso
    const proceso = this.proceso();
    if (proceso === 'homologacion') {
      additionalFields['tipoHomologacion'] = 'ASIGNATURAS';
      additionalFields['asignaturasHomologadas'] = [];
    } else if (proceso === 'paz-salvo') {
      additionalFields['tipoPazSalvo'] = 'ACADEMICO';
      additionalFields['semestre'] = '';
    } else if (proceso === 'reingreso') {
      additionalFields['motivoReingreso'] = '';
      additionalFields['semestreAnterior'] = '';
    }

    // Agregar campos opcionales del formulario
    const template = this.template();
    if (template.camposOpcionales) {
      template.camposOpcionales.forEach((campo) => {
        if (campo === 'observaciones' && !this.mostrarObservaciones()) {
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
    Object.keys(this.documentForm.controls).forEach((key) => {
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
    const labels: Record<string, string> = {
      numeroDocumento: 'Número de documento',
      fechaDocumento: 'Fecha del documento',
      observaciones: 'Observaciones',
    };
    return labels[fieldName] || fieldName;
  }

  hasError(fieldName: string): boolean {
    const control = this.documentForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  getTemplateIcon(): string {
    const icons: Record<string, string> = {
      OFICIO_HOMOLOGACION: 'description',
      PAZ_SALVO: 'verified_user',
      RESOLUCION_REINGRESO: 'assignment_turned_in',
    };
    return icons[this.template().id] || 'description';
  }

  /**
   * Maneja el clic en "Tengo un documento"
   */
  onTengoDocumento(): void {
    this.tengoDocumento.emit();
  }
}
