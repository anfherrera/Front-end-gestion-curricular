import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { SolicitudFormComponent, FieldConfig } from '../../../../shared/components/solicitud-form/solicitud-form.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-estudio-academico',
  standalone: true,
  imports: [
    CommonModule,
    CardContainerComponent,
    CursoListComponent,
    SolicitudFormComponent,
    ActionButtonComponent
  ],
  templateUrl: './estudio-academico.component.html',
  styleUrls: ['./estudio-academico.component.css']
})
export class EstudioAcademicoComponent {
  cursos: Curso[] = [
    { codigo: 'CS201', nombre: 'Redes Avanzadas', docente: 'Luis Torres', cupos: 10, estado: 'Disponible' },
    { codigo: 'CS202', nombre: 'Seguridad Informática', docente: 'Marta Díaz', cupos: 12, estado: 'Disponible' }
  ];

  displayedColumns: string[] = ['codigo', 'nombre', 'docente', 'cupos', 'estado', 'acciones'];
  acciones = ['seleccionar'];

  selectedCurso?: Curso;

  formConfig: FieldConfig[] = [
    { name: 'observacion', label: 'Observación', type: 'text' }
  ];

  seleccionarCurso(event: { accion: string; curso: Curso }) {
    if (event.accion === 'seleccionar') {
      this.selectedCurso = event.curso;
      console.log('Curso seleccionado para estudio académico:', this.selectedCurso);
    }
  }

  guardarEstudio() {
    if (!this.selectedCurso) {
      alert('Seleccione un curso primero.');
      return;
    }
    console.log('Guardando estudio académico para:', this.selectedCurso);
    alert(`Observación guardada para ${this.selectedCurso.nombre}`);
  }
}
