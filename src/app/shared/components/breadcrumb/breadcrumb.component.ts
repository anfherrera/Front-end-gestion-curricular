import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/** Miga de pan según Sistema de Diseño TIC (pág. 49) - Solo cuando hay más de 3 niveles */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (items.length > 0) {
      <nav class="breadcrumb" aria-label="Miga de pan">
        @for (item of items; track item.url; let last = $last) {
          @if (last) {
            <span class="breadcrumb-current">{{ item.label }}</span>
          } @else {
            <a [routerLink]="item.url">{{ item.label }}</a>
            <span class="breadcrumb-separator">/</span>
          }
        }
      </nav>
    }
  `,
  styles: [`
    .breadcrumb {
      font-family: var(--breadcrumb-font, 'Open Sans'), sans-serif;
      font-size: var(--breadcrumb-size, 14px);
      font-weight: var(--breadcrumb-weight, 300);
      color: var(--breadcrumb-color, #A7A6B0);
      margin-bottom: 8px;
    }
    .breadcrumb a {
      color: var(--breadcrumb-color, #A7A6B0);
      text-decoration: none;
    }
    .breadcrumb a:hover {
      color: var(--color-primario);
      text-decoration: underline;
    }
    .breadcrumb-separator {
      margin: 0 8px;
      color: var(--breadcrumb-color, #A7A6B0);
    }
    .breadcrumb-current {
      color: var(--color-neutro-texto);
    }
  `]
})
export class BreadcrumbComponent {
  items: { label: string; url: string }[] = [];

  private labels: Record<string, string> = {
    'estudiante': 'Estudiante',
    'funcionario': 'Funcionario',
    'coordinador': 'Coordinador',
    'secretaria': 'Secretaría',
    'admin': 'Administración',
    'paz-salvo': 'Paz y Salvo',
    'pruebas-ecaes': 'Pruebas ECAES',
    'cursos-intersemestrales': 'Cursos Intersemestrales',
    'homologacion-asignaturas': 'Homologación',
    'reingreso-estudiante': 'Reingreso',
    'modulo-estadistico': 'Estadísticas',
    'dashboard': 'Inicio',
    'solicitudes': 'Solicitudes',
    'gestionar': 'Gestionar Cursos',
    'preinscribir': 'Preinscribir',
    'inscribir': 'Inscribir',
    'manage-users': 'Usuarios',
    'crear': 'Crear',
    'editar': 'Editar',
    'programas': 'Programas',
    'docentes': 'Docentes',
    'manage-roles': 'Roles',
    'configurar-periodo': 'Configurar Período',
    'welcome': 'Inicio',
    'home': 'Inicio',
    'ajustes': 'Ajustes',
    'perfil': 'Mi Perfil',
    'historial-completo': 'Historial',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.buildBreadcrumb());
    this.buildBreadcrumb();
  }

  private buildBreadcrumb(): void {
    const url = this.router.url.split('?')[0];
    const segments = url.split('/').filter(s => s);
    this.items = [];

    // Solo mostrar cuando hay más de 3 niveles (Sistema de Diseño TIC)
    if (segments.length <= 3) return;

    let path = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      path += '/' + seg;
      const label = this.labels[seg] || this.formatLabel(seg);
      this.items.push({ label, url: path });
    }
  }

  private formatLabel(seg: string): string {
    if (/^\d+$/.test(seg)) return `#${seg}`;
    return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
