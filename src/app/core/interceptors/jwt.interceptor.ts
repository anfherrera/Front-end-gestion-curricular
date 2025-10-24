import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // 🔧 Detectar si es una petición con archivos (FormData)
  const isFormData = req.body instanceof FormData;

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

    // Si el token es válido, lo agregamos al header
    // ✅ NO configurar Content-Type para FormData (archivos)
    const headers: any = {
      Authorization: `Bearer ${token}`,
    };

    // Solo agregar Content-Type si NO es FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Accept'] = 'application/json';
      headers['Accept-Charset'] = 'utf-8';
    }

    const clonedReq = req.clone({ setHeaders: headers });
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
  // Peticiones sin token
  // ✅ NO configurar Content-Type para FormData (archivos)
  if (isFormData) {
    return next(req); // Dejar que el navegador configure el Content-Type automáticamente
  }

  const clonedReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8'
    }
  });

  return next(clonedReq);
};