import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores HTTP
      if (error instanceof HttpErrorResponse) {
        // Si es un error 401 (Unauthorized), el token puede estar expirado o inválido
        if (error.status === 401) {
          console.warn('🔐 Error 401: Token inválido o expirado');
          
          // Verificar si realmente el token está expirado
          const token = authService.getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const exp = payload.exp * 1000;
              const now = Date.now();
              
              // Si el token está expirado, hacer logout
              if (exp < now) {
                console.warn('⏳ Token expirado detectado en error 401');
                // Solo hacer logout si el token realmente expiró
                // Esto evita logouts inesperados cuando el usuario está activo
                authService.logout(false); // No mostrar mensaje, ya que puede ser por otra razón
              } else {
                // Token no expirado pero backend rechazó (puede ser token inválido o revocado)
                console.warn('⚠️ Token rechazado por el backend (puede estar revocado)');
                // Solo hacer logout si el backend rechazó explícitamente
                authService.logout(false);
              }
            } catch (e) {
              // Token malformado
              console.error('❌ Token malformado');
              authService.logout(false);
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

