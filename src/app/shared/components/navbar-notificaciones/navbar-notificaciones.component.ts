import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/services/auth.service';

// Componente simple del navbar como en la guía
@Component({
  selector: 'app-navbar-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="abrirNotificaciones()">
      🔔 Notificaciones
      <span *ngIf="contadorNoLeidas > 0" class="badge">
        {{ contadorNoLeidas }}
      </span>
    </button>
  `,
  styles: [`
    .badge {
      background-color: #ff4444;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
      margin-left: 5px;
    }
  `]
})
export class NavbarNotificacionesComponent implements OnInit {
  contadorNoLeidas: number = 0;
  
  constructor(
    private notificacionService: NotificacionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const usuario = this.authService.getUsuario();
    const usuarioId = usuario?.id_usuario;
    
    if (usuarioId) {
      this.actualizarContador(usuarioId);
      
      // Actualizar cada 30 segundos
      setInterval(() => {
        this.actualizarContador(usuarioId);
      }, 30000);
    }
  }
  
  actualizarContador(usuarioId: number) {
    this.notificacionService.contarNoLeidas(usuarioId)
      .subscribe({
        next: (count) => {
          this.contadorNoLeidas = count;
        },
        error: (error) => {
          console.error('Error al contar notificaciones:', error);
        }
      });
  }

  abrirNotificaciones() {
    // Navegar a la página de notificaciones
    window.location.href = '/notificaciones';
  }
}

