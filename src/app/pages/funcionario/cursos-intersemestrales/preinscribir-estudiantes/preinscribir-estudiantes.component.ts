import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { SolicitudFormComponent, FieldConfig } from '../../../../shared/components/solicitud-form/solicitud-form.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-preinscribir-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    CardContainerComponent,
    CursoListComponent,
    SolicitudFormComponent,
    ActionButtonComponent
  ],
  templateUrl: './preinscribir-estudiantes.component.html',
  styleUrls: ['./preinscribir-estudiantes.component.css']
})
export class PreinscribirEstudiantesComponent {
  cursos: Curso[] = [
    { codigo: 'CS101', nombre: 'Angular Básico', docente: 'Juan Pérez', cupos: 20, estado: 'Disponible' },
    { codigo: 'CS102', nombre: 'TypeScript Avanzado', docente: 'Ana Gómez', cupos: 15, estado: 'Disponible' }
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
      console.log('Curso seleccionado:', this.selectedCurso);
    }
  }

  preinscribir() {
    if (!this.selectedCurso) {
      alert('Seleccione un curso primero.');
      return;
    }
    console.log('Preinscribiendo estudiantes en:', this.selectedCurso);
    alert(`Estudiantes preinscritos en ${this.selectedCurso.nombre}`);
  }
}
