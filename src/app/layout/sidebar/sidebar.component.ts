import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { SIDEBAR_ITEMS, SidebarItem as ConfigSidebarItem, UserRole } from './sidebar.config';
import { Router } from '@angular/router';

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

  menuItems: ConfigSidebarItem[] = [];

  constructor(private authService: AuthService, private router: Router) {
    const role = this.authService.getRole();

    // Validamos que role sea un UserRole
    const validRoles: UserRole[] = ['admin', 'funcionario', 'coordinador', 'secretaria', 'estudiante'];
    const activeRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'estudiante';

    this.menuItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(activeRole));
  }

  onItemClick(item: ConfigSidebarItem) {
    if (item.action === 'logout') {
      this.logout();
    } else if (item.action === 'toggle') {
      this.toggleSidebar();
    } else if (item.route) {
      this.router.navigate([item.route]); // ✅ mejor que window.location.href
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
    this.authService.logout();
    console.log('Usuario deslogueado');
  }
}
