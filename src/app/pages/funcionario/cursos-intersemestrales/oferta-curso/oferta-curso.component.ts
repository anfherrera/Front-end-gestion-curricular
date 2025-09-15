import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudFormComponent, FieldConfig } from '../../../../shared/components/solicitud-form/solicitud-form.component';
import { UserRole } from '../../../../core/enums/roles.enum';

@Component({
  selector: 'app-oferta-curso',
  standalone: true,
  imports: [CommonModule, SolicitudFormComponent],
  templateUrl: './oferta-curso.component.html',
  styleUrls: ['./oferta-curso.component.css']
})
export class OfertaCursoComponent {
  // 🔹 Ejemplo usando config directo
  miConfig: FieldConfig[] = [
    { name: 'nombre', label: 'Nombre del curso', type: 'text' },
    { name: 'cupos', label: 'Número de cupos', type: 'number' },
    { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date' }
  ];

  // 🔹 Ejemplo usando rol (usa el fallback de SolicitudFormComponent)
  rolFuncionario = UserRole.FUNCIONARIO;
}
