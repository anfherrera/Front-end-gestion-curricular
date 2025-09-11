import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursosIntersemestralesService, Inscripcion } from '../../../../core/services/cursos-intersemestrales.service';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.css']
})
export class InscripcionesComponent implements OnInit {
  inscripciones: Inscripcion[] = [];
  cargando = true;

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.obtenerInscripciones();
  }

  obtenerInscripciones(): void {
    this.cursosService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener inscripciones', err);
        this.cargando = false;
      }
    });
  }

  cancelarInscripcion(id: number): void {
    if (!confirm('¿Seguro que deseas cancelar esta inscripción?')) return;

    this.cursosService.cancelarInscripcion(id).subscribe({
      next: () => {
        this.inscripciones = this.inscripciones.filter(i => i.id !== id);
      },
      error: (err) => console.error('Error al cancelar inscripción', err)
    });
  }
}
