
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LoggerService } from '../../core/services/logger.service';
import { interval, Subscription } from 'rxjs';
import { getLoginCooldownRemainingSeconds } from '../../core/interceptors/login-rate-limit.interceptor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hide = true;
  errorMensaje = '';
  cargando = false;
  // Rate limit
  rateRemaining = 0;
  loginDisabled = false;
  private rateSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar,
    private logger: LoggerService
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email, this.unicaucaEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false]
    });
  }

  ngOnInit(): void {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/welcome']);
      return;
    }

    // Iniciar contador de cooldown si aplica
    this.tickRate();
    
    // Solo iniciar el intervalo si localStorage está disponible (evitar problemas con SSR/HMR)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.rateSub = interval(1000).subscribe(() => {
        // Verificar que el componente aún esté activo antes de actualizar
        if (this.rateSub && !this.rateSub.closed) {
          this.tickRate();
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.rateSub && !this.rateSub.closed) {
      this.rateSub.unsubscribe();
      this.rateSub = undefined;
    }
  }

  private tickRate(): void {
    try {
      // Solo actualizar si localStorage está disponible
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const nuevoRate = getLoginCooldownRemainingSeconds();
        // Solo actualizar si el valor cambió para evitar detección de cambios innecesaria
        if (nuevoRate !== this.rateRemaining) {
          this.rateRemaining = nuevoRate;
          this.loginDisabled = this.rateRemaining > 0;
        }
      }
    } catch (error) {
      // Silenciar errores durante desarrollo/HMR
      console.warn('Error en tickRate (puede ignorarse durante HMR):', error);
      this.rateRemaining = 0;
      this.loginDisabled = false;
    }
  }

  // Validador personalizado para correos de Unicauca
  private unicaucaEmailValidator(control: AbstractControl): {[key: string]: any} | null {
    const email = control.value;
    if (!email) return null;
    
    const unicaucaPattern = /^[a-zA-Z0-9._%+-]+@unicauca\.edu\.co$/;
    return unicaucaPattern.test(email) ? null : { 'unicaucaEmail': true };
  }


  onLogin(): void {
    if (this.loginDisabled) {
      // Si está en cooldown, no permitir login
      return;
    }

    if (this.loginForm.valid) {
      const { correo, password, remember } = this.loginForm.value;
      this.cargando = true;
      this.errorMensaje = '';

      this.apiService.login(correo, password).subscribe({
        next: (response: any) => {
          this.logger.log('✅ Respuesta del backend recibida');

          if (response.token && response.usuario) {
            // ✅ Guardar token JWT después del login exitoso
            // El token se guarda en localStorage y se usará automáticamente
            // en todas las peticiones gracias al JwtInterceptor
            this.authService.setToken(response.token);
            this.authService.setUsuario(response.usuario);
            this.authService.setRole(response.usuario.rol?.nombre || 'Usuario');
            this.authService.restoreSession();

            this.logger.log('✅ Token guardado correctamente');

            // Mostrar mensaje de éxito
            this.snackBar.open(`¡Bienvenido, ${response.usuario.nombre_completo}!`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            // Redirigir a la página de home
            this.router.navigate(['/welcome']);
          } else {
            this.logger.error('❌ Respuesta inválida del servidor:', response);
            this.errorMensaje = 'Error: respuesta del servidor inválida.';
            this.snackBar.open('Error en la respuesta del servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }

          this.cargando = false;
        },
        error: (err) => {
          this.logger.error('❌ Error en la autenticación', err);
          
          // Manejo específico de errores según la guía del backend
          let errorMessage = 'Error al iniciar sesión';
          
          // 429 Too Many Requests (rate limit de login)
          if ((err as any)?.rateLimited && (err as any)?.retryAfterSeconds) {
            errorMessage = (err as any).message || 'Demasiados intentos. Intenta más tarde.';
            this.tickRate(); // actualizar contador
          } else
          if (err.status === 401) {
            // 401: Credenciales incorrectas
            errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
          } else if (err.status === 403) {
            // 403: Cuenta deshabilitada o sin permisos
            errorMessage = 'Tu cuenta está deshabilitada. Contacta al administrador.';
          } else if (err.status === 0) {
            // Error de conexión
            errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
          } else if (err.status >= 500) {
            // Error del servidor
            errorMessage = 'Error interno del servidor. Intenta más tarde.';
          }

          this.errorMensaje = errorMessage;
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          
          this.cargando = false;
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      
      this.snackBar.open('Por favor, completa todos los campos correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  // Método para limpiar errores
  clearError(): void {
    this.errorMensaje = '';
  }

  // Método para obtener mensaje de error del correo
  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('correo');
    if (emailControl?.hasError('required')) {
      return 'El correo es requerido';
    }
    if (emailControl?.hasError('email')) {
      return 'Ingresa un correo válido';
    }
    if (emailControl?.hasError('unicaucaEmail')) {
      return 'Debe ser un correo de @unicauca.edu.co';
    }
    return '';
  }

  // Método para obtener mensaje de error de la contraseña
  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    return '';
  }
}
