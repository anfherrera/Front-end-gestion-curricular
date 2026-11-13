import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { Notificacion } from '@core/models/notificaciones.model';
import { AuthService } from '@core/services/auth.service';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-notificaciones-guia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones-guia.component.html',
  styleUrls: ['./notificaciones-guia.component.css']
})
export class NotificacionesGuiaComponent implements OnInit, OnDestroy {
  private notificacionService = inject(NotificacionesService);
  private authService = inject(AuthService);
  private router = inject(Router);

  notificaciones: Notificacion[] = [];
  contadorNoLeidas = 0;
  usuarioId = 0;
  private intervaloSubscription?: Subscription;

  ngOnInit(): void {
    this.obtenerUsuarioId();
    
    if (this.usuarioId > 0) {
      this.cargarNotificaciones();
      this.actualizarContador();
    }

    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.intervaloSubscription) {
      this.intervaloSubscription.unsubscribe();
    }
  }

  obtenerUsuarioId(): void {
    const usuario = this.authService.getUsuario();
    if (usuario && usuario.id_usuario) {
      this.usuarioId = usuario.id_usuario;
    } else {
      const idGuardado = localStorage.getItem('usuarioId');
      if (idGuardado) {
        this.usuarioId = parseInt(idGuardado);
      }
    }
  }

  cargarNotificaciones(): void {
    if (this.usuarioId <= 0) {
      return;
    }

    this.notificacionService.obtenerTodas(this.usuarioId)
      .subscribe({
        next: (notificaciones: Notificacion[]) => {
          this.notificaciones = notificaciones;
        },
        error: (error: HttpErrorResponse) => {
          this.manejarError(error);
        }
      });
  }

  actualizarContador(): void {
    if (this.usuarioId <= 0) return;

    this.notificacionService.contarNoLeidas(this.usuarioId)
      .subscribe({
        next: (count) => {
          this.contadorNoLeidas = count;
        },
        error: () => {
          // Error silenciado
        }
      });
  }

  marcarComoLeida(notificacion: Notificacion): void {
    if (notificacion.leida) {
      return;
    }

    this.notificacionService.marcarComoLeida(notificacion.id_notificacion)
      .subscribe({
        next: () => {
          notificacion.leida = true;
          this.actualizarContador();
        },
        error: () => {
          // Error silenciado
        }
      });
  }

  marcarTodasComoLeidas(): void {
    if (this.usuarioId <= 0) return;

    this.notificacionService.marcarTodasComoLeidas(this.usuarioId)
      .subscribe({
        next: () => {
          this.notificaciones.forEach(n => n.leida = true);
          this.contadorNoLeidas = 0;
        },
        error: () => {
          // Error silenciado
        }
      });
  }

  iniciarActualizacionAutomatica(): void {
    this.intervaloSubscription = interval(30000)
      .subscribe(() => {
        if (this.usuarioId > 0) {
          this.cargarNotificaciones();
          this.actualizarContador();
        }
      });
  }

  manejarError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.router.navigate(['/login']);
    }
  }
}

