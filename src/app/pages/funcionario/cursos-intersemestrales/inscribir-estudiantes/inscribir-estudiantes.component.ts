import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { SolicitudFormComponent, FieldConfig } from '../../../../shared/components/solicitud-form/solicitud-form.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-inscribir-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    CardContainerComponent,
    CursoListComponent,
    SolicitudFormComponent,
    ActionButtonComponent
  ],
  templateUrl: './inscribir-estudiantes.component.html',
  styleUrls: ['./inscribir-estudiantes.component.css']
})
export class InscribirEstudiantesComponent {
  cursos: Curso[] = [
    { codigo: 'CS301', nombre: 'Desarrollo Web', docente: 'Pedro Gómez', cupos: 18, estado: 'Disponible' },
    { codigo: 'CS302', nombre: 'Bases de Datos', docente: 'Clara Jiménez', cupos: 20, estado: 'Disponible' }
  ];

  displayedColumns: string[] = ['codigo', 'nombre', 'docente', 'cupos', 'estado', 'acciones'];
  acciones = ['seleccionar'];

  selectedCurso?: Curso;

  formConfig: FieldConfig[] = [
    { name: 'archivoPago', label: 'Archivo de pago', type: 'file' }
  ];

  seleccionarCurso(event: { accion: string; curso: Curso }) {
    if (event.accion === 'seleccionar') {
      this.selectedCurso = event.curso;
      console.log('Curso seleccionado para inscripción:', this.selectedCurso);
    }
  }

  inscribir() {
    if (!this.selectedCurso) {
      alert('Seleccione un curso primero.');
      return;
    }
    console.log('Inscribiendo estudiantes en:', this.selectedCurso);
    alert(`Estudiantes inscritos en ${this.selectedCurso.nombre}`);
  }
}
