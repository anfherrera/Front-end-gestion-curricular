import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-cursos-intersemestrales-gestion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './cursos-intersemestrales.component.html',
  styleUrls: ['./menu-cursos-comun.css', './cursos-intersemestrales.component.css']
})
export class CursosIntersemestralesGestionComponent {
  opciones = [
    { titulo: 'Resumen', ruta: 'dashboard', icon: 'dashboard' },
    { titulo: 'Gestionar Cursos', ruta: 'gestionar', icon: 'settings' },
    { titulo: 'Preinscribir Estudiantes', ruta: 'preinscribir', icon: 'person_add' },
    { titulo: 'Inscribir Estudiantes', ruta: 'inscribir', icon: 'how_to_reg' },
    { titulo: 'Visualizar Solicitudes', ruta: 'solicitudes', icon: 'list_alt' },
  ];
}
