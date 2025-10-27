import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  role: string | null = null;
  roleLower: string | null = null;
  userName = '';
  availableProcesses: { name: string; route: string; icon: string; color: string }[] = [];

  private readonly processMap = [
    // Panel de Administración (solo para admin)
    { name: 'Panel de Administración', route: 'dashboard', icon: 'dashboard', color: 'bg-blue', adminOnly: true },
    { name: 'Gestión de Docentes', route: 'docentes', icon: 'school', color: 'bg-green', adminOnly: true },
    { name: 'Gestión de Programas', route: 'programas', icon: 'assignment', color: 'bg-orange', adminOnly: true },
    { name: 'Gestión de Roles', route: 'manage-roles', icon: 'admin_panel_settings', color: 'bg-purple', adminOnly: true },
    { name: 'Gestión de Usuarios', route: 'manage-users', icon: 'people', color: 'bg-red', adminOnly: true },
    
    // Procesos generales
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
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.role = usuario.rol?.nombre ?? this.authService.getRole();

      // Normalizamos y convertimos undefined → null
      this.roleLower = this.role ? this.role.toLowerCase() : null;

      // Mapear sinónimos de roles
      if (this.roleLower === 'secretario') this.roleLower = 'secretaria';
      if (this.roleLower === 'administrador') this.roleLower = 'admin';

      this.userName = usuario.nombre_completo ?? this.getUserName();
    } else {
      this.router.navigate(['/login']);
    }

    this.filterProcessesByRole();
  }

  private filterProcessesByRole(): void {
    if (!this.roleLower) return;

    this.availableProcesses = this.processMap.filter(p => {
      // Si el usuario es ADMIN, solo mostrar opciones adminOnly
      if (this.roleLower === 'admin') {
        return (p as any).adminOnly === true;
      }

      // Para otros roles, NO mostrar opciones adminOnly
      if ((p as any).adminOnly) {
        return false;
      }

      // Filtrar por rol para opciones generales
      switch (this.roleLower) {
        case 'coordinador':
          return ['paz-salvo', 'reingreso-estudiante', 'homologacion-asignaturas', 'modulo-estadistico', 'ajustes'].includes(p.route);
        case 'funcionario':
          return ['paz-salvo', 'pruebas-ecaes', 'cursos-intersemestrales', 'reingreso-estudiante', 'homologacion-asignaturas', 'modulo-estadistico', 'ajustes'].includes(p.route);
        case 'estudiante':
          return ['paz-salvo', 'pruebas-ecaes', 'cursos-intersemestrales', 'reingreso-estudiante', 'homologacion-asignaturas'].includes(p.route);
        case 'secretaria':
          return ['paz-salvo', 'reingreso-estudiante', 'homologacion-asignaturas'].includes(p.route);
        default:
          return false;
      }
    });
  }

  private getUserName(): string {
    return 'Usuario Ejemplo';
  }

  getWelcomeText(): string {
    switch (this.roleLower) {
      case 'admin': return 'Accede al panel de administración para gestionar docentes, programas, roles y usuarios del sistema.';
      case 'coordinador': return 'Puedes administrar los procesos y supervisar estudiantes.';
      case 'funcionario': return 'Accede a los procesos que gestionas.';
      case 'estudiante': return 'Solicita tus procesos y revisa el estado de tus solicitudes.';
      case 'secretaria': return 'Gestiona los oficios y resoluciones según lo indicado.';
      default: return 'Bienvenido al sistema.';
    }
  }

  handleProcessClick(process: any): void {
  const currentRole = this.roleLower ?? 'estudiante';

  // Caso especial: opciones del panel de administración
  if (process.adminOnly && currentRole === 'admin') {
    this.router.navigate(['/admin/' + process.route]);
    return;
  }

  // Rutas base por rol para procesos generales
  const roleRoutes: Record<string, string> = {
    estudiante: '/estudiante',
    funcionario: '/funcionario',
    coordinador: '/coordinador',
    secretaria: '/secretaria',
    admin: '/admin'
  };

  // Caso especial: estudiante y Paz y Salvo
  if (process.route === 'paz-salvo' && currentRole === 'estudiante') {
    const dialogRef = this.dialog.open(PazSalvoDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.router.navigate([roleRoutes[currentRole] + '/paz-salvo']);
    });
    return;
  }

  if (process.route === 'homologacion-asignaturas' && currentRole === 'estudiante') {
      this.router.navigate(['/estudiante/homologacion-asignaturas']);
      return;
  }

  // Navegación normal para todos los procesos
  this.router.navigate([roleRoutes[currentRole] + '/' + process.route]);
}


  logout(): void {
    this.authService.logout();
  }
}
