import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, filter } from 'rxjs';

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
    { titulo: 'Realizar Solicitud', ruta: 'solicitudes', icon: 'add_circle' },
    { titulo: 'Cursos Disponibles', ruta: 'cursos-ofertados', icon: 'school' },
    { titulo: 'Ver Lista de Cursos para Preinscripción', ruta: 'cursos-preinscripcion', icon: 'playlist_add' },
    { titulo: 'Seguimiento', ruta: 'ver-solicitud', icon: 'list_alt' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('🚀 CURSOS INTERSEMESTRALES COMPONENT INICIADO');
    console.log('📍 URL actual:', this.router.url);
    this.setupNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupNavigation(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        console.log('📍 Navegación a:', event.url);
      });
  }

  hasActiveRoute(): boolean {
    return this.router.url !== '/estudiante/cursos-intersemestrales';
  }
}