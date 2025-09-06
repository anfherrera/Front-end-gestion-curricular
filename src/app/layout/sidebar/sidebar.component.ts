import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { PazSalvoDialogComponent } from '../../pages/estudiante/paz-salvo/paz-salvo-dialog.component';
import { SIDEBAR_ITEMS, SidebarItem, UserRole } from './sidebar.config';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class SidebarComponent {
  @Output() toggle = new EventEmitter<void>();
  isSidebarOpen = true;
  menuItems: SidebarItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {
    const role = this.authService.getRole() as UserRole | null; // 👈 Cast seguro

    if (role) {
      this.menuItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(role));
    } else {
      // Si no hay rol, podrías decidir no mostrar ningún ítem
      this.menuItems = [];
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.toggle.emit();
  }

  onItemClick(item: SidebarItem) {
    if (item.action === 'paz-salvo') {
      this.handlePazSalvoClick();
    }
  }

  logout() {
    this.authService.logout();
  }

  handlePazSalvoClick() {
    const role = this.authService.getRole() as UserRole | null;

    if (role === 'estudiante') {
      const dialogRef = this.dialog.open(PazSalvoDialogComponent, { width: '500px' });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.router.navigate(['/paz-salvo/estudiante']);
        }
      });
      return;
    }

    switch (role) {
      case 'funcionario': this.router.navigate(['/paz-salvo/funcionario']); break;
      case 'coordinador': this.router.navigate(['/paz-salvo/coordinador']); break;
      case 'secretaria': this.router.navigate(['/paz-salvo/secretaria']); break;
      default: this.router.navigate(['/home']);
    }
  }
}
