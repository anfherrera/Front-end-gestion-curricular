import { Component, computed, inject } from '@angular/core';

import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

/** Miga de pan según Sistema de Diseño TIC (pág. 49) - Solo cuando hay más de 3 niveles */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterModule],
  template: `
    @if (items().length > 0) {
      <nav class="breadcrumb" aria-label="Miga de pan">
        @for (item of items(); track item.url; let last = $last) {
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
      display: flex;
      flex-wrap: wrap;
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
  private router = inject(Router);

  /** URL actual (sin query), al día con cada navegación. */
  private readonly url = toSignal(
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url }
  );

  readonly items = computed(() => this.construirMigas(this.url()));

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
    'perfil': 'Mi Perfil',
    'historial-completo': 'Historial',
  };

  private construirMigas(url: string): { label: string; url: string }[] {
    const segments = url.split('?')[0].split('/').filter(s => s);

    // Solo mostrar cuando hay más de 3 niveles (Sistema de Diseño TIC)
    if (segments.length <= 3) return [];

    let path = '';
    return segments.map(seg => {
      path += '/' + seg;
      return { label: this.labels[seg] || this.formatLabel(seg), url: path };
    });
  }

  private formatLabel(seg: string): string {
    if (/^\d+$/.test(seg)) return `#${seg}`;
    return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
