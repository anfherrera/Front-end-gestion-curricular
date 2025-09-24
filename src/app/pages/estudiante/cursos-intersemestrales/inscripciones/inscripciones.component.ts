import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, Inscripcion } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.css']
})
export class InscripcionesComponent {
  inscripciones: Inscripcion[] = [];
  cargando = true;

  constructor(private cursosService: CursosIntersemestralesService) {
    this.loadInscripciones();
  }

  loadInscripciones() {
    this.cargando = true;
    this.cursosService.getInscripciones().subscribe({
      next: data => {
        this.inscripciones = data;
        this.cargando = false;
      },
      error: err => {
        console.error('Error cargando inscripciones', err);
        this.cargando = false;
      }
    });
  }

  onCancelarInscripcion(inscripcion: Inscripcion) {
    if (!confirm(`¿Deseas cancelar la inscripción al curso ID ${inscripcion.cursoId}?`)) return;

    this.cursosService.cancelarInscripcion(inscripcion.id).subscribe({
      next: () => {
        alert('Inscripción cancelada correctamente');
        this.loadInscripciones();
      },
      error: err => console.error('Error cancelando inscripción', err)
    });
  }
}
