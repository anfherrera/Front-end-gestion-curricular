import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  if (token) {
    // Decodificar token para validar expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir a milisegundos
    const now = Date.now();

    if (exp < now) {
      console.warn('⏳ Token expirado. Cerrando sesión...');
      authService.logout();
      router.navigate(['/login']);
      return next(req); // No se envía token porque está expirado
    }

    // Si el token es válido, lo agregamos al header con UTF-8
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    });

    return next(clonedReq);
  }

  // Peticiones sin token también deben tener UTF-8
  const clonedReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8'
    }
  });

  return next(clonedReq);
};
