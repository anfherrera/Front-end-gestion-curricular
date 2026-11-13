import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router, NavigationEnd } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';

@Component({
  selector: 'app-cursos-intersemestrales',
  imports: [
    RouterModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    MatTooltipModule
],
  templateUrl: './cursos-intersemestrales.component.html',
  styleUrls: ['../../common/cursos-intersemestrales/menu-cursos-comun.css', './cursos-intersemestrales.component.css']
})
export class CursosIntersemestralesComponent implements OnInit {
  private router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);
  
  opciones = [
    { titulo: 'Realizar Solicitud', ruta: 'solicitudes', icon: 'add_circle' },
    { titulo: 'Cursos Disponibles', ruta: 'cursos-ofertados', icon: 'school' },
    { titulo: 'Ver Lista de Cursos para Preinscripción', ruta: 'cursos-preinscripcion', icon: 'playlist_add' },
    { titulo: 'Seguimiento', ruta: 'ver-solicitud', icon: 'list_alt' },
  ];

  ngOnInit(): void {
    this.setupNavigation();
  }

  private setupNavigation(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        // Navegación completada
      });
  }

  hasActiveRoute(): boolean {
    return this.router.url !== '/estudiante/cursos-intersemestrales';
  }
}