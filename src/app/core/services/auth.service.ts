import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(public router: Router) {} // 👈 router es público

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

  // Guardar rol del usuario
  setRole(role: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('role', role);
    }
  }

  // Obtener rol del usuario
  getRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('role');
    }
    return null;
  }

  // Cerrar sesión
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('role'); // 👈 Limpiar rol al cerrar sesión
    }
    this.router.navigate(['/login']);
  }
}
