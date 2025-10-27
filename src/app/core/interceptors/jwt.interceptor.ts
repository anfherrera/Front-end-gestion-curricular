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
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();

      if (exp < now) {
        console.warn('⏳ Token expirado. Las peticiones se enviarán sin autenticación.');
        console.warn('💡 Por favor, cierre sesión y vuelva a iniciar sesión.');
        
        // NO cerrar sesión automáticamente, solo no enviar el token
        // authService.logout();
        // router.navigate(['/login']);
        
        // Continuar con la petición SIN token
        const isFormData = req.body instanceof FormData;
        
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
      }
    } catch (error) {
      console.error('❌ Error decodificando token:', error);
      // Si hay error decodificando, continuar sin token
      return next(req);
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