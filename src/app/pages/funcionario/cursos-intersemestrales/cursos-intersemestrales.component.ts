import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cursos-intersemestrales',
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
  styleUrls: ['./cursos-intersemestrales.component.css']
})
export class CursosIntersemestralesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  opciones = [
    { titulo: 'Dashboard', ruta: 'dashboard', icon: 'dashboard' },
    { titulo: 'Gestionar Cursos', ruta: 'gestionar', icon: 'settings' },
    { titulo: 'Preinscribir Estudiantes', ruta: 'preinscribir', icon: 'person_add' },
    { titulo: 'Inscribir Estudiantes', ruta: 'inscribir', icon: 'how_to_reg' },
    { titulo: 'Visualizar Solicitudes', ruta: 'solicitudes', icon: 'list_alt' },
  ];

  constructor() {}

  ngOnInit(): void {
    // Componente de cursos intersemestrales iniciado
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}