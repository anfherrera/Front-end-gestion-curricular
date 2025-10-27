import { Component, EventEmitter, Output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ActivityIndicatorComponent } from '../../shared/components/activity-indicator/activity-indicator.component';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ OnPush - datos no cambian constantemente
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    ActivityIndicatorComponent
  ]
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  isSidebarOpen = true;
  userName: string = '';
  userEmail: string = '';
  userInitials: string = 'U'; // ✅ CACHEAR para evitar recalcular en cada ciclo
  userRole: string = 'Usuario'; // ✅ CACHEAR

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.userName = usuario.nombre_completo;
      this.userEmail = usuario.correo;
      // ✅ Calcular UNA VEZ en ngOnInit
      this.userInitials = this.calculateUserInitials();
      this.userRole = this.calculateUserRole();
    }
  }

  toggleSidebarClick(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.toggleSidebar.emit();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ✅ Métodos privados para calcular UNA VEZ
  private calculateUserInitials(): string {
    if (!this.userName) return 'U';

    const names = this.userName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.userName.substring(0, 2).toUpperCase();
  }

  private calculateUserRole(): string {
    const role = this.authService.getRole();
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'funcionario': return 'Funcionario';
      case 'coordinador': return 'Coordinador';
      case 'secretario':
      case 'secretaria': return 'Secretaria';
      case 'estudiante': return 'Estudiante';
      default: return 'Usuario';
    }
  }

  // ✅ Getters públicos que devuelven propiedades cacheadas (no recalculan)
  getUserInitials(): string {
    return this.userInitials;
  }

  getUserRole(): string {
    return this.userRole;
  }
}
