import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursosIntersemestralesService, Curso, Inscripcion } from '../../../../core/services/cursos-intersemestrales.service';
import { CreateInscripcionDTO } from '../../../../core/services/cursos-intersemestrales.service';

@Component({
  selector: 'app-cursos-ofertados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursos-ofertados.component.html',
  styleUrls: ['./cursos-ofertados.component.css']
})
export class CursosOfertadosComponent implements OnInit {
  cursos: Curso[] = [];
  cargando = true;
  inscribiendo: number | null = null; // para saber si está inscribiendo un curso

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.obtenerCursosOfertados();
  }

  obtenerCursosOfertados(): void {
    this.cursosService.getCursosOfertados().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener cursos ofertados', err);
        this.cargando = false;
      }
    });
  }

 inscribirme(curso: Curso): void {
  this.inscribiendo = curso.id;

  const payload: CreateInscripcionDTO = {
    cursoId: curso.id,
    estudianteId: 1, // 🔗 luego lo tomas del usuario logueado
    fecha: new Date().toISOString(),
    estado: 'inscrito'
  };

  this.cursosService.crearInscripcion(payload).subscribe({
    next: (resp: Inscripcion) => {
      alert(`Inscripción exitosa en ${curso.nombre}`);
      this.inscribiendo = null;
    },
    error: (err) => {
      console.error('Error al inscribirse', err);
      alert('No fue posible inscribirse en este curso.');
      this.inscribiendo = null;
    }
  });
}
}
