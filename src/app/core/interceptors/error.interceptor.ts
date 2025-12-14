import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ActivityMonitorService } from '../services/activity-monitor.service';
import { LoggerService } from '../services/logger.service';
import { catchError, throwError } from 'rxjs';

/**
 * 🚨 Error Interceptor
 * 
 * Maneja errores HTTP relacionados con autenticación y autorización:
 * - 401 Unauthorized: Token ausente, inválido o expirado → Redirigir a login
 * - 403 Forbidden: Usuario autenticado pero sin permisos → Mostrar error
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const activityMonitor = inject(ActivityMonitorService);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores HTTP
      if (error instanceof HttpErrorResponse) {
        // ===== 401 UNAUTHORIZED =====
        // Token ausente, inválido o expirado
        if (error.status === 401) {
          logger.warn('Error 401 recibido del backend - Token inválido o expirado');
          
          const token = authService.getToken();
          
          if (token) {
            // Hay token pero el backend lo rechazó
            // Verificar si está expirado o es inválido
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const exp = payload.exp * 1000;
              const now = Date.now();
              const timeUntilExpiry = exp - now;
              
              // Verificar si el usuario está activo
              const isUserActive = activityMonitor.isActive();
              
              // Hacer logout si:
              // 1. Token realmente expirado (con margen de 30 segundos)
              // 2. Token a punto de expirar Y usuario inactivo
              const EXPIRY_MARGIN = 30 * 1000; // 30 segundos de margen
              
              if (timeUntilExpiry < -EXPIRY_MARGIN) {
                // Token realmente expirado
                logger.warn('Token expirado - haciendo logout');
                authService.logout(true); // Mostrar mensaje de expiración
              } else if (timeUntilExpiry < EXPIRY_MARGIN && !isUserActive) {
                // Token a punto de expirar y usuario inactivo
                logger.warn('Token a punto de expirar y usuario inactivo - haciendo logout');
                authService.logout(true);
              } else {
                // Token válido pero backend rechazó (puede ser revocado o error temporal)
                logger.warn('Token válido pero backend rechazó - puede ser error temporal');
                // No hacer logout automático si el usuario está activo
                // El error se propagará para que el componente lo maneje
              }
            } catch (e) {
              // Token malformado
              logger.error('Token malformado - haciendo logout', e);
              authService.logout(false);
            }
          } else {
            // No hay token - redirigir al login
            if (!router.url.includes('/login')) {
              logger.warn('No hay token - redirigiendo a login');
              router.navigate(['/login']);
            }
          }
        }
        
        // ===== 403 FORBIDDEN =====
        // Usuario autenticado pero sin permisos para el recurso
        if (error.status === 403) {
          // No mostrar error 403 para endpoints de períodos académicos (puede ocurrir si el usuario no está autenticado)
          const isPeriodosEndpoint = error.url?.includes('/periodos-academicos/');
          if (!isPeriodosEndpoint) {
            logger.warn('🚫 Error 403: Acceso denegado - Usuario sin permisos');
          }
          // No hacer logout, solo dejar que el error se propague
          // El componente puede mostrar un mensaje de error apropiado
        }
      }
      
      // Re-lanzar el error para que los componentes puedan manejarlo
      return throwError(() => error);
    })
  );
};

