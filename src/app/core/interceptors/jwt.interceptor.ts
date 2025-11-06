import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = authService.getToken();

  if (token) {
    // Decodificar token para validar expiración
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      
      // Solo verificar expiración, pero NO hacer logout aquí
      // El logout se manejará en el error interceptor cuando el backend responda con 401
      // Esto evita redirecciones inesperadas cuando el usuario está activo
      if (exp < now) {
        console.warn('⏳ Token expirado detectado, pero permitiendo la petición para que el backend lo valide');
        // No hacer logout aquí, dejar que el backend responda y el error interceptor lo maneje
        // Esto permite que el usuario continúe usando la app hasta que el backend rechace la petición
      }
    } catch (e) {
      console.error('❌ Error decodificando token:', e);
      // Token malformado, pero no hacer logout aquí
      // Dejar que el error interceptor lo maneje cuando el backend responda
    }

    // Detectar si la petición es multipart/form-data (subida de archivos)
    const isFormData = req.body instanceof FormData;

    // Si el token es válido, lo agregamos al header
    // IMPORTANTE: No establecer Content-Type para FormData, el navegador lo hace automáticamente
    const headers: any = {
      Authorization: `Bearer ${token}`
    };

    // Solo agregar Content-Type si NO es FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Accept'] = 'application/json';
      headers['Accept-Charset'] = 'utf-8';
    }

    const clonedReq = req.clone({
      setHeaders: headers
    });

    return next(clonedReq);
  }

  // Peticiones sin token
  const isFormData = req.body instanceof FormData;
  
  // Solo agregar Content-Type si NO es FormData
  if (!isFormData) {
    const clonedReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    });
    return next(clonedReq);
  }

  return next(req);
};