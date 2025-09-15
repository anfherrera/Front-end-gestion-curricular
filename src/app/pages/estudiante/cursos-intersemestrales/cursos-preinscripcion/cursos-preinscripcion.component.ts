import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { CursosIntersemestralesService, CreateInscripcionDTO } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-cursos-preinscripcion',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-preinscripcion.component.html',
  styleUrls: ['./cursos-preinscripcion.component.css']
})
export class CursosPreinscripcionComponent {
  cursos: Curso[] = [];
  cargando = true;

  constructor(private cursosService: CursosIntersemestralesService) {
    this.loadCursos();
  }

  loadCursos() {
    this.cargando = true;
    this.cursosService.getCursosPreinscripcion().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos de preinscripción', err);
        this.cargando = false;
      }
    });
  }

  onAccionCurso(event: { accion: string; curso: Curso }) {
    if (event.accion === 'preinscribir') {
      const payload: CreateInscripcionDTO = {
        cursoId: Number(event.curso.codigo),
        estudianteId: 1, // reemplaza con el ID real del estudiante
        fecha: new Date().toISOString(),
        estado: 'inscrito' // literal 'inscrito', compatible con CreateInscripcionDTO
      };

      this.cursosService.crearInscripcion(payload).subscribe({
        next: () => {
          alert(`Te has preinscrito en ${event.curso.nombre}`);
          this.loadCursos(); // refresca la lista
        },
        error: (err) => console.error('Error al preinscribir', err)
      });
    }
  }
}
