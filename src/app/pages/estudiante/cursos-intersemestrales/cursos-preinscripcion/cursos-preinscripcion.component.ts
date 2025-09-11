import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursosIntersemestralesService, Curso } from '../../../../core/services/cursos-intersemestrales.service';

@Component({
  selector: 'app-cursos-preinscripcion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursos-preinscripcion.component.html',
  styleUrls: ['./cursos-preinscripcion.component.css']
})
export class CursosPreinscripcionComponent implements OnInit {
  cursos: Curso[] = [];
  seleccionados: Curso[] = [];
  cargando = true;

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.obtenerCursosPreinscripcion();
  }

  obtenerCursosPreinscripcion(): void {
    this.cursosService.getCursosPreinscripcion().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener cursos de preinscripción', err);
        this.cargando = false;
      }
    });
  }

  toggleSeleccion(curso: Curso): void {
    if (this.seleccionados.includes(curso)) {
      this.seleccionados = this.seleccionados.filter(c => c.id !== curso.id);
    } else {
      this.seleccionados.push(curso);
    }
  }

  confirmarPreinscripcion(): void {
    console.log("Cursos seleccionados para preinscripción:", this.seleccionados);
    // 🔗 Luego aquí se conecta con el back (POST)
  }
}
