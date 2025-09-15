import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-cursos-ofertados',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-ofertados.component.html',
  styleUrls: ['./cursos-ofertados.component.css']
})
export class CursosOfertadosComponent {
  cursos: Curso[] = [];
  cargando = true;

  constructor(private cursosService: CursosIntersemestralesService) {
    this.loadCursos();
  }

  loadCursos() {
    this.cargando = true;
    this.cursosService.getCursosOfertados().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos ofertados', err);
        this.cargando = false;
      }
    });
  }

  onAccionCurso(event: { accion: string; curso: Curso }) {
    if (event.accion === 'inscribir') {
      // Lógica de inscripción (temporal, luego conectar con backend)
      alert(`Intentando inscribirse en ${event.curso.nombre}`);
      // Aquí puedes llamar a this.cursosService.crearInscripcion(...)
    }
  }
}
