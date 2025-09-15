import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-publicar-curso',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ActionButtonComponent],
  templateUrl: './publicar-curso.component.html',
  styleUrls: ['./publicar-curso.component.css']
})
export class PublicarCursoComponent {
  cursos: Curso[] = [
    { codigo: 'CS101', nombre: 'Angular Básico', docente: 'Juan Pérez', cupos: 20, estado: 'Disponible' },
    { codigo: 'CS102', nombre: 'TypeScript Avanzado', docente: 'Ana Gómez', cupos: 15, estado: 'Cerrado' }
  ];

  displayedColumns: string[] = ['codigo', 'nombre', 'docente', 'cupos', 'estado', 'acciones'];
  acciones = ['eliminar'];

  ejecutarAccion(event: { accion: string; curso: Curso }) {
    if (event.accion === 'eliminar') {
      this.cursos = this.cursos.filter(c => c.codigo !== event.curso.codigo);
      console.log('Curso eliminado:', event.curso);
    }
  }

  publicarCursos() {
    console.log('Cursos publicados:', this.cursos);
    alert('Cursos publicados con éxito.');
  }
}
