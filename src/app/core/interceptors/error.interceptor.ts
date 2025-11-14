import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ActivityMonitorService } from '../services/activity-monitor.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const activityMonitor = inject(ActivityMonitorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores HTTP
      if (error instanceof HttpErrorResponse) {
        // Si es un error 401 (Unauthorized), el token puede estar expirado o inválido
        if (error.status === 401) {
          console.warn('🔐 Error 401 recibido del backend');
          
          // Verificar si realmente el token está expirado
          const token = authService.getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const exp = payload.exp * 1000;
              const now = Date.now();
              const timeUntilExpiry = exp - now;
              
              // ✅ Verificar si el usuario está activo
              const isUserActive = activityMonitor.isActive();
              
              // ✅ SOLO hacer logout si:
              // 1. El token REALMENTE está expirado (con margen de 30 segundos para evitar problemas de sincronización)
              // 2. Y el usuario NO está activo (para evitar logouts cuando el usuario está usando la app)
              const EXPIRY_MARGIN = 30 * 1000; // 30 segundos de margen
              
              if (timeUntilExpiry < -EXPIRY_MARGIN) {
                // Token realmente expirado (con margen)
                console.warn('⏳ Token expirado detectado - haciendo logout');
                authService.logout(true); // Mostrar mensaje de expiración
              } else if (timeUntilExpiry < EXPIRY_MARGIN && !isUserActive) {
                // Token a punto de expirar Y usuario inactivo
                console.warn('⏳ Token a punto de expirar y usuario inactivo - haciendo logout');
                authService.logout(true);
              } else {
                // ⚠️ Token NO expirado pero backend rechazó
                // Esto puede ser un error temporal del backend, problema de red, o token revocado
                // NO hacer logout automáticamente si el usuario está activo
                console.warn('⚠️ Token válido pero backend rechazó (puede ser error temporal)');
                console.warn(`⚠️ Usuario activo: ${isUserActive}, Tiempo hasta expiración: ${Math.round(timeUntilExpiry / 1000)}s`);
                console.warn('⚠️ NO se hará logout automático - el componente puede manejar el error');
                // El error se propagará y el componente puede decidir qué hacer
                // Esto evita logouts inesperados cuando el usuario está activo
              }
            } catch (e) {
              // Token malformado - solo hacer logout si realmente está malformado
              console.error('❌ Error decodificando token:', e);
              // Verificar si el token existe pero está malformado
              if (token && token.length > 0) {
                console.error('❌ Token malformado - haciendo logout');
                authService.logout(false);
              } else {
                // Token vacío o null - no hacer logout, solo redirigir si no estamos en login
                if (!router.url.includes('/login')) {
                  router.navigate(['/login']);
                }
              }
            }
          } else {
            // No hay token, redirigir al login solo si no estamos ya en login
            if (!router.url.includes('/login')) {
              router.navigate(['/login']);
            }
          }
        }
        
        // Si es un error 403 (Forbidden), no hacer logout, solo mostrar error
        // El usuario está autenticado pero no tiene permisos
        if (error.status === 403) {
          console.warn('🚫 Error 403: Acceso denegado');
          // No hacer logout, solo dejar que el error se propague para que el componente lo maneje
        }
      }
      
      // Re-lanzar el error para que los componentes puedan manejarlo
      return throwError(() => error);
    })
  );
};

