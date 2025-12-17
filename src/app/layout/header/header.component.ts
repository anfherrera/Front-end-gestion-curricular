import { Component, EventEmitter, Output, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PeriodosAcademicosService, PeriodoAcademico } from '../../core/services/periodos-academicos.service';
import { NotificationsHeaderComponent } from '../../shared/components/notifications-header/notifications-header.component';
import { formatearPeriodo } from '../../core/utils/periodo.utils';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // OnPush - datos no cambian constantemente
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    NotificationsHeaderComponent
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  isSidebarOpen = true;
  userName: string = '';
  userEmail: string = '';
  userInitials: string = 'U'; // CACHEAR para evitar recalcular en cada ciclo
  userRole: string = 'Usuario'; // CACHEAR
  periodoActual: PeriodoAcademico | null = null;
  periodoFormateado: string = '';
  private periodoSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private periodosService: PeriodosAcademicosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.userName = usuario.nombre_completo;
      this.userEmail = usuario.correo;
      // Calcular UNA VEZ en ngOnInit
      this.userInitials = this.calculateUserInitials();
      this.userRole = this.calculateUserRole();
    }

    // Suscribirse primero al período actual para recibir actualizaciones
    this.periodoSubscription = this.periodosService.periodoActual$.subscribe(periodo => {
      this.periodoActual = periodo;
      if (periodo) {
        this.periodoFormateado = periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
      } else {
        this.periodoFormateado = '';
      }
      this.cdr.markForCheck();
    });

    // Verificar si hay período cargado en el servicio
    const periodoCargado = this.periodosService.getPeriodoActualValue();
    if (periodoCargado) {
      this.periodoActual = periodoCargado;
      this.periodoFormateado = periodoCargado.nombrePeriodo || formatearPeriodo(periodoCargado.valor);
      this.cdr.markForCheck();
    } else {
      // Si no hay período cargado, intentar cargarlo
      // El endpoint NO requiere autenticación
      if (typeof window !== 'undefined') {
        this.periodosService.getPeriodoActual().subscribe({
          next: (periodo) => {
            if (periodo) {
              this.periodoActual = periodo;
              this.periodoFormateado = periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
              this.cdr.markForCheck();
            } else {
              this.periodoFormateado = '';
              this.cdr.markForCheck();
            }
          },
          error: (error) => {
            this.periodoFormateado = '';
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.periodoSubscription) {
      this.periodoSubscription.unsubscribe();
    }
  }

  toggleSidebarClick(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.toggleSidebar.emit();
  }

  goToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  goToSettings(): void {
    this.router.navigate(['/ajustes']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Métodos privados para calcular UNA VEZ
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

  // Getters públicos que devuelven propiedades cacheadas (no recalculan)
  getUserInitials(): string {
    return this.userInitials;
  }

  getUserRole(): string {
    return this.userRole;
  }
}
