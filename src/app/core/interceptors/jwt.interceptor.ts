import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

/**
 * JWT Interceptor
 * 
 * Agrega automáticamente el token JWT en el header Authorization de todas las peticiones
 * excepto el endpoint de login (que es público).
 * 
 * Formato del header: Authorization: Bearer <token>
 */
export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const logger = inject(LoggerService);

  // EXCLUIR endpoint de login - no requiere token
  const isLoginEndpoint = req.url.includes('/usuarios/login');
  
  if (isLoginEndpoint) {
    // Para el login, no agregar token (es un endpoint público)
    return next(req);
  }

  const token = authService.getToken();

  if (token) {
    // Decodificar token para validar expiración (solo para logging, no para bloquear)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      
      // Solo verificar expiración para logging, pero NO hacer logout aquí
      // El logout se manejará en el error interceptor cuando el backend responda con 401
      if (exp < now) {
        logger.warn('Token expirado detectado, pero permitiendo la petición para que el backend lo valide');
      }
    } catch (e) {
      logger.error('Error decodificando token:', e);
      // Token malformado, pero no hacer logout aquí
      // Dejar que el error interceptor lo maneje cuando el backend responda
    }

    // Detectar si la petición es multipart/form-data (subida de archivos)
    const isFormData = req.body instanceof FormData;

    // Agregar token JWT en el header Authorization
    // Formato: Authorization: Bearer <token>
    const headers: any = {
      Authorization: `Bearer ${token}`
    };

    // Solo agregar Content-Type si NO es FormData
    // (el navegador lo establece automáticamente para FormData)
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

  // Peticiones sin token (pero que no son login)
  // El backend responderá con 401 si requiere autenticación
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