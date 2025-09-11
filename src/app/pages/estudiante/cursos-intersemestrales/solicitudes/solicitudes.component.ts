import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CursosIntersemestralesService, Solicitud } from '../../../../core/services/cursos-intersemestrales.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  solicitudes: Solicitud[] = [];

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.cursosService.getSolicitudes().subscribe({
      next: (data) => (this.solicitudes = data),
      error: (err) => console.error('Error cargando solicitudes:', err)
    });
  }

  nuevaSolicitud() {
    const payload = { fecha: new Date().toISOString(), estado: 'pendiente' as const };

    this.cursosService.crearSolicitud(payload).subscribe({
      next: (nueva) => this.solicitudes.push(nueva),
      error: (err) => console.error('Error creando solicitud:', err)
    });
  }
}
