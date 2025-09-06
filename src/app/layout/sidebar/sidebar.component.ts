// sidebar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service'; // ajusta la ruta

interface SidebarItem {
  label: string;
  icon: string;
  action?: 'logout' | 'toggle';
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule]
})
export class SidebarComponent {
  @Output() toggle = new EventEmitter<void>();
  isSidebarOpen = true;

  constructor(private authService: AuthService) {} // inyectamos el servicio

  menuItems: SidebarItem[] = [
    { label: 'Inicio', icon: 'home' },
    { label: 'Proceso Paz y Salvo', icon: 'check_circle' },
    { label: 'Pruebas ECAES', icon: 'school' },
    { label: 'Cursos Intersemestrales', icon: 'menu_book' },
    { label: 'Reingreso de Estudiante', icon: 'assignment_ind' },
    { label: 'Homologación de Asignaturas', icon: 'description' },
    { label: 'Ajustes', icon: 'settings' },
    { label: 'Cerrar sesión', icon: 'logout', action: 'logout' },
    { label: 'Minimizar', icon: 'chevron_left', action: 'toggle' }
  ];

  onItemClick(item: SidebarItem) {
    if (item.action === 'logout') {
      this.logout();
    } else if (item.action === 'toggle') {
      this.toggleSidebar();
    } else {
      console.log('Click en:', item.label);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.toggle.emit();
  }

  logout() {
    this.authService.logout(); // llama a tu método de logout real
    console.log('Usuario deslogueado');
  }
}
