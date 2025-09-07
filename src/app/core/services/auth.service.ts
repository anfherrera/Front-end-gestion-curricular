// // src/app/core/services/auth.service.ts
// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private readonly TOKEN_KEY = 'token';
//   private readonly USER_KEY = 'usuario';
//   private readonly ROLE_KEY = 'userRole';
//   private readonly EXPIRATION_KEY = 'sessionExpiration'; // 🔥 Nuevo
//   private readonly SESSION_TIME = 1 * 60 * 1000; // 1 minuto en milisegundos

//   private role: string | null = null;

//   constructor(private router: Router) {}

//   // ===== Token =====
//   setToken(token: string): void {
//     localStorage.setItem(this.TOKEN_KEY, token);
//     this.setExpiration(); // 🔥 Cada vez que inicia sesión o renueva, ponemos expiración
//   }

//   getToken(): string | null {
//     return localStorage.getItem(this.TOKEN_KEY);
//   }

//   clearToken(): void {
//     localStorage.removeItem(this.TOKEN_KEY);
//     localStorage.removeItem(this.EXPIRATION_KEY);
//     this.role = null;
//   }

//   // ===== Usuario =====
//   setUsuario(usuario: any): void {
//     localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
//   }

//   getUsuario(): any | null {
//     const userData = localStorage.getItem(this.USER_KEY);
//     return userData ? JSON.parse(userData) : null;
//   }

//   // ===== Rol =====
//   setRole(role: string): void {
//     this.role = role;
//     localStorage.setItem(this.ROLE_KEY, role);
//   }

//   getRole(): string | null {
//     return this.role ?? localStorage.getItem(this.ROLE_KEY);
//   }

//   // ===== Expiración de Sesión =====
//   private setExpiration(): void {
//     const expirationTime = Date.now() + this.SESSION_TIME;
//     localStorage.setItem(this.EXPIRATION_KEY, expirationTime.toString());
//   }

//   private isSessionExpired(): boolean {
//     const expiration = localStorage.getItem(this.EXPIRATION_KEY);
//     if (!expiration) return true;
//     return Date.now() > parseInt(expiration, 10);
//   }

//   // ===== Autenticación =====
//   isAuthenticated(): boolean {
//     if (!this.getToken()) return false;

//     if (this.isSessionExpired()) {
//       this.logout();
//       return false;
//     }
//     return true;
//   }

//   // ===== Logout =====
//   logout(): void {
//     localStorage.removeItem(this.TOKEN_KEY);
//     localStorage.removeItem(this.USER_KEY);
//     localStorage.removeItem(this.ROLE_KEY);
//     localStorage.removeItem(this.EXPIRATION_KEY);
//     this.role = null;
//     this.router.navigate(['/login']);
//   }
// }
//=================================================================
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLE_KEY = 'userRole';
  private readonly EXP_KEY = 'tokenExp';
  private role: string | null = null;
  private logoutTimer: any;

  constructor(private router: Router) {}

  // ===== TOKEN =====
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    // Extraer fecha de expiración del token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // en milisegundos
    localStorage.setItem(this.EXP_KEY, exp.toString());

    // Programar logout automático
    this.startLogoutTimer(exp);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXP_KEY);
    this.role = null;
    clearTimeout(this.logoutTimer);
  }

  // ===== USUARIO =====
  setUsuario(usuario: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  getUsuario(): any | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // ===== ROL =====
  setRole(role: string): void {
    this.role = role;
    localStorage.setItem(this.ROLE_KEY, role);
  }

  getRole(): string | null {
    return this.role ?? localStorage.getItem(this.ROLE_KEY);
  }

  // ===== AUTENTICACIÓN =====
  isAuthenticated(): boolean {
    const token = this.getToken();
    const exp = localStorage.getItem(this.EXP_KEY);

    if (!token || !exp) return false;

    const now = Date.now();
    return now < Number(exp);
  }

  // ===== LOGOUT =====
  logout(showMessage: boolean = false): void {

    if (showMessage) {
      alert('⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EXP_KEY);
    this.role = null;
    clearTimeout(this.logoutTimer);
    this.router.navigate(['/login']);
  }

  // ===== TIMER PARA LOGOUT AUTOMÁTICO =====
  private startLogoutTimer(expirationTime: number): void {
    const now = Date.now();
    const timeLeft = expirationTime - now;

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }

    if (timeLeft > 0) {
      this.logoutTimer = setTimeout(() => {
        this.logout();
      }, timeLeft);
    } else {
      this.logout();
    }
  }

  // Llamar este método en AppComponent para restaurar el timer tras recargar la página
  restoreSession(): void {
    const exp = localStorage.getItem(this.EXP_KEY);
    if (exp) {
      this.startLogoutTimer(Number(exp));
    }
  }
}

