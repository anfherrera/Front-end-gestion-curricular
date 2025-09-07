import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class authGuard implements CanActivate{
  // const authService = inject(AuthService);

  // if (!authService.isAuthenticated()) {
  //   authService.router.navigate(['/login']); // 🚀 funciona porque router es público
  //   return false;
  // }

  // return true;
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}