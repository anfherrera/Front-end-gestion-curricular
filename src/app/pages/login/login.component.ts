import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  hide = true;
  errorMensaje = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { correo, password } = this.loginForm.value;
      this.cargando = true;
      this.errorMensaje = '';

      this.apiService.login(correo, password).subscribe({
        next: (response: any) => {
          console.log('✅ Respuesta del backend:', response);

          if (response.token) {
            this.authService.setToken(response.token);
            this.authService.setUsuario(response.usuario);
            this.router.navigate(['/home']);
          } else {
            this.errorMensaje = 'Error: no se recibió token.';
          }

          this.cargando = false;
        },
        error: (err) => {
          console.error('❌ Error en la autenticación', err);
          this.errorMensaje = 'Credenciales incorrectas o error en el servidor.';
          this.cargando = false;
        }
      });
    }
  }
}
