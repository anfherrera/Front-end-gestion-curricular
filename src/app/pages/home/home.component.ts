import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  role: string | null = null;
  userName: string = '';
  availableProcesses: any[] = [];

  processMap = [
    { name: 'Proceso Paz y Salvo', route: 'paz-salvo', icon: 'check_circle', color: 'bg-blue' },
    { name: 'Pruebas ECAES', route: 'pruebas-ecaes', icon: 'assignment', color: 'bg-green' },
    { name: 'Cursos Intersemestrales', route: 'cursos-intersemestrales', icon: 'school', color: 'bg-orange' },
    { name: 'Reingreso Estudiante', route: 'reingreso-estudiante', icon: 'person_add', color: 'bg-purple' },
    { name: 'Homologación Asignaturas', route: 'homologacion-asignaturas', icon: 'sync_alt', color: 'bg-red' },
    { name: 'Módulo Estadístico', route: 'modulo-estadistico', icon: 'bar_chart', color: 'bg-teal' },
    { name: 'Ajustes', route: 'ajustes', icon: 'settings', color: 'bg-gray' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.userName = this.getUserName();

    // Filtrar procesos según rol
    this.availableProcesses = this.processMap.filter(p => {
      switch(this.role) {
        case 'admin':
        case 'coordinador':
        case 'funcionario':
          return true;
        case 'estudiante':
          return ['paz-salvo','pruebas-ecaes','cursos-intersemestrales','reingreso-estudiante','homologacion-asignaturas'].includes(p.route);
        case 'secretaria':
          return ['reingreso-estudiante','homologacion-asignaturas'].includes(p.route);
        default:
          return false;
      }
    });
  }

  getUserName(): string {
    return 'Usuario Ejemplo';
  }

  getWelcomeText(role: string | null): string {
    switch(role) {
      case 'admin': return 'Tienes acceso completo a todos los procesos.';
      case 'coordinador': return 'Puedes administrar los procesos y supervisar estudiantes.';
      case 'funcionario': return 'Accede a los procesos que gestionas.';
      case 'estudiante': return 'Solicita tus procesos y revisa el estado de tus solicitudes.';
      case 'secretaria': return 'Gestiona los oficios y resoluciones según lo indicado.';
      default: return 'Bienvenido al sistema.';
    }
  }
}
