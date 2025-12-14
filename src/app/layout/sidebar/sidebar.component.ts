// src/app/layout/sidebar/sidebar.component.ts
import { Component, EventEmitter, Output, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SIDEBAR_ITEMS, SidebarItem as ConfigSidebarItem } from './sidebar.config';
import { UserRole } from '../../core/enums/roles.enum';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PazSalvoDialogComponent } from '../../pages/estudiante/paz-salvo/paz-salvo-dialog.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // OnPush - menu items estáticos
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule]
})
export class SidebarComponent implements OnChanges {
  @Input() isOpen = true;
  @Output() toggle = new EventEmitter<void>();
  isSidebarOpen = true;
  menuItems: ConfigSidebarItem[] = [];
  private roleLower: UserRole;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {
    // Intentar obtener el rol del localStorage primero
    let backendRole = this.authService.getRole();
    
    // FALLBACK: Si el rol es null o incorrecto, leer del usuario directamente
    if (!backendRole || backendRole === UserRole.ESTUDIANTE) {
      const usuario = this.authService.getUsuario();
      if (usuario?.rol?.nombre) {
        const rolDelUsuario = usuario.rol.nombre;
        // Actualizar el rol en el servicio
        this.authService.setRole(rolDelUsuario);
        // Volver a leer el rol actualizado
        backendRole = this.authService.getRole();
      }
    }
    
    this.roleLower = this.mapBackendRoleToUserRole(backendRole);
    this.menuItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(this.roleLower));
  }

  ngOnChanges() {
    this.isSidebarOpen = this.isOpen;
  }

  // TrackBy para optimizar ngFor
  trackByLabel(index: number, item: ConfigSidebarItem): string {
    return item.label;
  }

  private mapBackendRoleToUserRole(backendRole: string | null | undefined): UserRole {
    switch (backendRole?.toLowerCase()) {
      case 'admin':
      case 'administrador': return UserRole.ADMIN;
      case 'funcionario': return UserRole.FUNCIONARIO;
      case 'coordinador': return UserRole.COORDINADOR;
      case 'secretario':
      case 'secretaria': return UserRole.SECRETARIA;
      case 'estudiante': return UserRole.ESTUDIANTE;
      case 'decano': return UserRole.DECANO;
      default: return UserRole.ESTUDIANTE;
    }
  }

  onItemClick(item: ConfigSidebarItem) {
    if (item.action === 'logout') { this.logout(); return; }
    if (item.action === 'toggle') { this.toggleSidebar(); return; }
    if (item.action === 'separator') { return; } // No hacer nada en separadores
    if (!item.route) return;

    if (item.route === '/estudiante/paz-salvo' && this.roleLower === UserRole.ESTUDIANTE) {
      const dialogRef = this.dialog.open(PazSalvoDialogComponent, { width: '500px' });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.router.navigate(['/estudiante/paz-salvo']);
      });
      return;
    }

    this.router.navigate([item.route]);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    const toggleItem = this.menuItems.find(i => i.action === 'toggle');
    if (toggleItem) toggleItem.icon = this.isSidebarOpen ? 'chevron_left' : 'chevron_right';
    this.toggle.emit();
  }

  logout() {
    this.authService.logout();
    console.log('Usuario deslogueado');
    this.router.navigate(['/login']);
  }
}
