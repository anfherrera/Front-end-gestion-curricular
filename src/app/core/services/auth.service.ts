import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(public router: Router) {} // 👈 router es público ahora

  // Obtener token de forma segura
  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Validar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Guardar token (por ejemplo al hacer login)
  setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // Cerrar sesión
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
