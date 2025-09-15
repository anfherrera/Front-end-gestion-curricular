import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestionar-cursos',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ActionButtonComponent],
  templateUrl: './gestionar-cursos.component.html',
  styleUrls: ['./gestionar-cursos.component.css']
})
export class GestionarCursosComponent {
  cursos: Curso[] = [
    { codigo: 'CS101', nombre: 'Angular Básico', docente: 'Juan Pérez', cupos: 20, estado: 'Disponible' },
    { codigo: 'CS102', nombre: 'TypeScript Avanzado', docente: 'Ana Gómez', cupos: 15, estado: 'Cerrado' }
  ];

  displayedColumns: string[] = ['codigo', 'nombre', 'docente', 'cupos', 'estado', 'acciones'];
  acciones = ['ofertar', 'publicar'];

  constructor(private router: Router) {}

  ejecutarAccion(event: { accion: string; curso: Curso }) {
    console.log('Acción ejecutada:', event);
    if (event.accion === 'ofertar') {
      this.router.navigate(['funcionario/cursos-intersemestrales/ofertar']);
    } else if (event.accion === 'publicar') {
      this.router.navigate(['funcionario/cursos-intersemestrales/publicar']);
    }
  }
}
