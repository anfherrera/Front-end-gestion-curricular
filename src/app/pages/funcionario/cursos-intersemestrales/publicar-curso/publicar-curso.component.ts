import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';

@Component({
  selector: 'app-publicar-curso',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ActionButtonComponent],
  templateUrl: './publicar-curso.component.html',
  styleUrls: ['./publicar-curso.component.css']
})
export class PublicarCursoComponent {
  cursos: Curso[] = [
    { codigo: 'C001', nombre: 'Redes Avanzadas', docente: 'Juan Pérez', cupos: 20, estado: 'Disponible' }
  ];
  acciones = ['Eliminar'];

  onAccion(event: { accion: string; curso: Curso }) {
    console.log('Acción ejecutada:', event);
  }

  publicarCursos() {
    console.log('Publicar cursos'); // Aquí va la lógica real después
  }
}
