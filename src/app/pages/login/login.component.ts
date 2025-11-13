
import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hide = true;
  errorMensaje = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
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
    if (this.loginForm.valid) {
      const { correo, password, remember } = this.loginForm.value;
      this.cargando = true;
      this.errorMensaje = '';

      this.apiService.login(correo, password).subscribe({
        next: (response: any) => {
          console.log('✅ Respuesta del backend:', response);

          if (response.token && response.usuario) {
            // Guardar en AuthService (esto ya maneja localStorage internamente)
            this.authService.setToken(response.token);
            this.authService.setUsuario(response.usuario);
            this.authService.setRole(response.usuario.rol?.nombre || 'Usuario');
            this.authService.restoreSession();

            // Mostrar mensaje de éxito
            this.snackBar.open(`¡Bienvenido, ${response.usuario.nombre_completo}!`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            // Redirigir a la página de home
            this.router.navigate(['/welcome']);
          } else {
            console.error('❌ Respuesta inválida:', response);
            this.errorMensaje = 'Error: respuesta del servidor inválida.';
            this.snackBar.open('Error en la respuesta del servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }

          this.cargando = false;
        },
        error: (err) => {
          console.error('❌ Error en la autenticación', err);
          
          // Manejo específico de errores
          let errorMessage = 'Error al iniciar sesión';
          
          if (err.status === 401) {
            errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
          } else if (err.status === 403) {
            errorMessage = 'Tu cuenta está deshabilitada. Contacta al administrador.';
          } else if (err.status === 0) {
            errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
          } else if (err.status >= 500) {
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
