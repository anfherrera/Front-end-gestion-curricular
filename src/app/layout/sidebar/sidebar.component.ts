// src/app/layout/sidebar/sidebar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

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

  constructor(private authService: AuthService) {}

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
      this.logout(); // ✅ llama al AuthService
    } else if (item.action === 'toggle') {
      this.toggleSidebar();
    } else {
      console.log('Click en:', item.label);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    const toggleItem = this.menuItems.find(i => i.action === 'toggle');
    if (toggleItem) {
      toggleItem.icon = this.isSidebarOpen ? 'chevron_left' : 'chevron_right';
    }
    this.toggle.emit();
  }

  logout() {
    this.authService.logout(); // limpia token y redirige al login
    console.log('Usuario deslogueado');
  }
}
