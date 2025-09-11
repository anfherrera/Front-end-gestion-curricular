import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-cursos-intersemestrales',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './cursos-intersemestrales.component.html',
  styleUrls: ['./cursos-intersemestrales.component.css']
})
export class CursosIntersemestralesComponent {
  opciones = [
    { titulo: 'Solicitudes', ruta: 'solicitudes', icon: 'assignment' },
    { titulo: 'Inscripciones', ruta: 'inscripciones', icon: 'how_to_reg' },
    { titulo: 'Cursos ofertados', ruta: 'cursos-ofertados', icon: 'school' },
    { titulo: 'Cursos preinscripción', ruta: 'cursos-preinscripcion', icon: 'playlist_add' },
    { titulo: 'Mis Solicitudes', ruta: 'ver-solicitud', icon: 'list_alt' },
  ];
}
