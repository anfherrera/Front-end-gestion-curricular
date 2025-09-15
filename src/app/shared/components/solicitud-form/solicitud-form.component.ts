import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../material.imports';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../core/enums/roles.enum';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'file';
  readonly?: boolean;
  options?: string[];
}

@Component({
  selector: 'app-solicitud-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './solicitud-form.component.html',
  styleUrls: ['./solicitud-form.component.css']
})
export class SolicitudFormComponent implements OnInit {
  @Input() role: UserRole = UserRole.ESTUDIANTE;
  @Input() editable: boolean = true; // <-- ahora sí existe en TS

  form!: FormGroup;
  fields: FieldConfig[] = []; // <-- ahora sí existe en TS

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.fields = this.getFieldsForRole(this.role);

    // Inicializa los form controls dinámicamente
    const controls: any = {};
    this.fields.forEach(field => {
      controls[field.name] = [{ value: '', disabled: field.readonly || !this.editable }];
    });

    this.form = this.fb.group(controls);
  }

  getFieldsForRole(role: UserRole): FieldConfig[] {
    switch (role) {
      case UserRole.ADMIN:
        return [
          { name: 'nombre', label: 'Nombre', type: 'text' },
          { name: 'fecha', label: 'Fecha', type: 'date' },
          { name: 'tipo', label: 'Tipo', type: 'select', options: ['General', 'Especial'] }
        ];
      case UserRole.FUNCIONARIO:
        return [
          { name: 'codigo', label: 'Código Funcionario', type: 'number' },
          { name: 'archivo', label: 'Documento', type: 'file' }
        ];
      case UserRole.COORDINADOR:
        return [
          { name: 'observacion', label: 'Observación', type: 'text' },
          { name: 'fechaRevision', label: 'Fecha Revisión', type: 'date' }
        ];
      case UserRole.SECRETARIA:
        return [
          { name: 'radicado', label: 'Número Radicado', type: 'number' }
        ];
      default: // ESTUDIANTE
        return [
          { name: 'nombre', label: 'Nombre', type: 'text' },
          { name: 'documento', label: 'Documento', type: 'file' }
        ];
    }
  }

  onFileSelected(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      console.log(`Archivo seleccionado para ${fieldName}:`, input.files[0]);
      // podrías guardar el archivo en el form si lo necesitas
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Datos enviados:', this.form.value);
    }
  }
}
