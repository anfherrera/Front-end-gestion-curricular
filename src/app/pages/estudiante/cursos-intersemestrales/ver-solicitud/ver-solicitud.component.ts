import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursosIntersemestralesService, Solicitud } from '../../../../core/services/cursos-intersemestrales.service';

@Component({
  selector: 'app-ver-solicitud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-solicitud.component.html',
  styleUrls: ['./ver-solicitud.component.css']
})
export class VerSolicitudComponent implements OnInit {
  solicitud: Solicitud | null = null;
  cargando = true;
  error: string | null = null;

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.obtenerSolicitudEstudiante();
  }

  obtenerSolicitudEstudiante(): void {
    // 🚨 Aquí debería ir el id real del estudiante (ejemplo: desde auth)
    const estudianteId = 1; 

    this.cursosService.getSolicitudEstudiante(estudianteId).subscribe({
      next: (data) => {
        this.solicitud = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener la solicitud del estudiante', err);
        this.error = 'No fue posible cargar tu solicitud.';
        this.cargando = false;
      }
    });
  }
}
