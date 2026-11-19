import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import { MENSAJE_SIN_CONEXION } from '@core/services/error-handler.service';
import { interval, Subscription } from 'rxjs';
import {
  getLoginCooldownRemainingSeconds,
  esErrorLimiteLogin,
  ErrorLimiteLogin,
} from '@core/interceptors/login-rate-limit.interceptor';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private logger = inject(LoggerService);

  loginForm: FormGroup;
  hide = true;
  readonly errorMensaje = signal('');
  readonly cargando = signal(false);
  // Rate limit
  readonly rateRemaining = signal(0);
  readonly loginDisabled = signal(false);
  private rateSub?: Subscription;

  constructor() {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email, this.unicaucaEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false],
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
        if (nuevoRate !== this.rateRemaining()) {
          this.rateRemaining.set(nuevoRate);
          this.loginDisabled.set(this.rateRemaining() > 0);
        }
      }
    } catch (error) {
      // Silenciar errores durante desarrollo/HMR
      this.rateRemaining.set(0);
      this.loginDisabled.set(false);
    }
  }

  // Validador personalizado para correos de Unicauca
  private unicaucaEmailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;

    const unicaucaPattern = /^[a-zA-Z0-9._%+-]+@unicauca\.edu\.co$/;
    return unicaucaPattern.test(email) ? null : { unicaucaEmail: true };
  }

  onLogin(): void {
    if (this.loginDisabled()) {
      // Si está en cooldown, no permitir login
      return;
    }

    if (this.loginForm.valid) {
      const { correo, password } = this.loginForm.value;
      this.cargando.set(true);
      this.errorMensaje.set('');

      this.authService.login(correo, password).subscribe({
        next: (response) => {
          if (response.token && response.usuario) {
            // Guardar token JWT después del login exitoso
            // El token se guarda en localStorage y se usará automáticamente
            // en todas las peticiones gracias al JwtInterceptor
            this.authService.setToken(response.token);
            this.authService.setUsuario(response.usuario);
            this.authService.setRole(response.usuario.rol?.nombre || 'Usuario');
            this.authService.restoreSession();

            // Mostrar mensaje de éxito
            this.snackbar.exito(`¡Bienvenido, ${response.usuario.nombre_completo}!`);

            // Redirigir a la página de home
            this.router.navigate(['/welcome']);
          } else {
            this.logger.error('Respuesta inválida del servidor:', response);
            this.errorMensaje.set('Error: respuesta del servidor inválida.');
            this.snackbar.error('Error en la respuesta del servidor');
          }

          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse | ErrorLimiteLogin) => {
          this.logger.error('Error en la autenticación', err);

          // Manejo específico de errores según la guía del backend
          let errorMessage = 'Error al iniciar sesión';

          // 429 Too Many Requests (rate limit de login)
          if (esErrorLimiteLogin(err) && err.retryAfterSeconds) {
            errorMessage = err.message || 'Demasiados intentos. Intenta más tarde.';
            this.tickRate(); // actualizar contador
          } else if (err.status === 401) {
            // 401: Credenciales incorrectas
            errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
          } else if (err.status === 403) {
            // 403: Cuenta deshabilitada o sin permisos
            errorMessage = 'Tu cuenta está deshabilitada. Contacta al administrador.';
          } else if (err.status === 0) {
            // Error de conexión
            errorMessage = MENSAJE_SIN_CONEXION;
          } else if (err.status >= 500) {
            // Error del servidor
            errorMessage = 'Error interno del servidor. Intenta más tarde.';
          }

          this.errorMensaje.set(errorMessage);
          this.snackbar.error(errorMessage);

          this.cargando.set(false);
        },
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });

      this.snackbar.advertencia('Por favor, completa todos los campos correctamente');
    }
  }

  // Método para limpiar errores
  clearError(): void {
    this.errorMensaje.set('');
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
