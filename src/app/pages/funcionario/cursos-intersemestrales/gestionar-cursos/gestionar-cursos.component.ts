import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestionar-cursos',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ActionButtonComponent],
  templateUrl: './gestionar-cursos.component.html',
  styleUrls: ['./gestionar-cursos.component.css']
})
export class GestionarCursosComponent {
  cursos: Curso[] = [
    { codigo: 'C001', nombre: 'Redes Avanzadas', docente: 'Juan Pérez', cupos: 20, estado: 'Disponible' },
    { codigo: 'C002', nombre: 'Seguridad Informática', docente: 'María Gómez', cupos: 15, estado: 'Cerrado' }
  ];
  acciones = ['Ofertar', 'Publicar'];

  constructor(private router: Router) {}

  onAccion(event: { accion: string; curso: Curso }) {
    switch (event.accion.toLowerCase()) {
      case 'ofertar':
        this.router.navigate(['funcionario/cursos-intersemestrales/ofertar']);
        break;
      case 'publicar':
        this.router.navigate(['funcionario/cursos-intersemestrales/publicar']);
        break;
    }
  }
}
