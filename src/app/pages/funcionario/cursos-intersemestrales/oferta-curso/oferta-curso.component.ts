import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { SolicitudFormComponent, FieldConfig } from '../../../../shared/components/solicitud-form/solicitud-form.component';
import { UserRole } from '../../../../core/enums/roles.enum';

@Component({
  selector: 'app-oferta-curso',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, SolicitudFormComponent],
  templateUrl: './oferta-curso.component.html',
  styleUrls: ['./oferta-curso.component.css']
})
export class OfertaCursoComponent {
  config: FieldConfig[] = [
    { name: 'nombre', label: 'Nombre del curso', type: 'text' },
    { name: 'cupos', label: 'Número de cupos', type: 'number' },
    { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date' }
  ];
  role = UserRole.FUNCIONARIO;
}
