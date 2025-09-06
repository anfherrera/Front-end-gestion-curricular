import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '../../../core/services/auth.service';
import { PazSalvoDialogComponent } from '../../estudiante/paz-salvo/paz-salvo-dialog.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  role: string | null = null;
  userName = '';
  availableProcesses: { name: string; route: string; icon: string; color: string }[] = [];

  private readonly processMap = [
    { name: 'Proceso Paz y Salvo', route: 'paz-salvo', icon: 'check_circle', color: 'bg-blue' },
    { name: 'Pruebas ECAES', route: 'pruebas-ecaes', icon: 'assignment', color: 'bg-green' },
    { name: 'Cursos Intersemestrales', route: 'cursos-intersemestrales', icon: 'school', color: 'bg-orange' },
    { name: 'Reingreso Estudiante', route: 'reingreso-estudiante', icon: 'person_add', color: 'bg-purple' },
    { name: 'Homologación Asignaturas', route: 'homologacion-asignaturas', icon: 'sync_alt', color: 'bg-red' },
    { name: 'Módulo Estadístico', route: 'modulo-estadistico', icon: 'bar_chart', color: 'bg-teal' },
    { name: 'Ajustes', route: 'ajustes', icon: 'settings', color: 'bg-gray' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.userName = this.getUserName();
    this.filterProcessesByRole();
  }

  private filterProcessesByRole(): void {
    this.availableProcesses = this.processMap.filter(p => {
      switch (this.role) {
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

  private getUserName(): string {
    return 'Usuario Ejemplo'; // 🚀 luego esto puede venir de tu API/AuthService
  }

  getWelcomeText(): string {
    switch (this.role) {
      case 'admin': return 'Tienes acceso completo a todos los procesos.';
      case 'coordinador': return 'Puedes administrar los procesos y supervisar estudiantes.';
      case 'funcionario': return 'Accede a los procesos que gestionas.';
      case 'estudiante': return 'Solicita tus procesos y revisa el estado de tus solicitudes.';
      case 'secretaria': return 'Gestiona los oficios y resoluciones según lo indicado.';
      default: return 'Bienvenido al sistema.';
    }
  }

  handleProcessClick(process: { route: string }): void {
    if (process.route === 'paz-salvo') {
      if (this.role === 'estudiante') {
        const dialogRef = this.dialog.open(PazSalvoDialogComponent, { width: '500px' });
        dialogRef.afterClosed().subscribe(result => {
          if (result) this.router.navigate(['/paz-salvo/estudiante']);
        });
        return;
      }

      // Otros roles
      const roleRoutes: Record<string, string> = {
        funcionario: '/paz-salvo/funcionario',
        coordinador: '/paz-salvo/coordinador',
        secretaria: '/paz-salvo/secretaria'
      };
      this.router.navigate([roleRoutes[this.role ?? ''] ?? '/home']);
      return;
    }

    this.router.navigate(['/' + process.route]);
  }
}
