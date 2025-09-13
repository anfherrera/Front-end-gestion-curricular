
// import { Component } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { Router } from '@angular/router';
// import { AuthService } from '../../core/services/auth.service';
// import { ApiService } from '../../core/services/api.service';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatInputModule,
//     MatButtonModule,
//     MatIconModule,
//     MatFormFieldModule,
//     MatCheckboxModule
//   ],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   hide = true;
//   errorMensaje = '';
//   cargando = false;

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private apiService: ApiService,
//     private router: Router
//   ) {
//     this.loginForm = this.fb.group({
//       correo: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(8)]],
//       remember: [false]
//     });
//   }

//   onLogin(): void {
//     if (this.loginForm.valid) {
//       const { correo, password } = this.loginForm.value;
//       this.cargando = true;
//       this.errorMensaje = '';

//       this.apiService.login(correo, password).subscribe({
//         next: (response: any) => {
//           console.log('✅ Respuesta del backend:', response);
//           console.log('✅ Tipo de respuesta:', typeof response);
//           console.log('✅ Keys de la respuesta:', Object.keys(response));

//           if (response.token && response.usuario) {
//             // Guardar token y usuario en AuthService
//             this.authService.setToken(response.token);
//             this.authService.setUsuario(response.usuario);
//             this.authService.setRole(response.usuario.rol?.nombre || 'Usuario');

//             // ✅ Restaurar sesión (esto asegura que el temporizador empiece)
//             this.authService.restoreSession();

//             // Redirigir al home
//             this.router.navigate(['/home']);
//           } else {
//             console.log('❌ Respuesta no tiene token o usuario:', response);
//             this.errorMensaje = 'Error: no se recibió token o usuario.';
//           }

//           this.cargando = false;
//         },
//         error: (err) => {
//           console.error('❌ Error en la autenticación', err);
//           console.error('❌ Status:', err.status);
//           console.error('❌ Error body:', err.error);
//           this.errorMensaje = 'Credenciales incorrectas o error en el servidor.';
//           this.cargando = false;
//         }
//       });
//     }
//   }
// }

//====================================
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

          if (response.token && response.usuario) {
            // Guardar en AuthService
            this.authService.setToken(response.token);
            this.authService.setUsuario(response.usuario);
            this.authService.setRole(response.usuario.rol?.nombre || 'Usuario');
            this.authService.restoreSession();

            // ✅ Guardar también en localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('usuario', JSON.stringify(response.usuario));

            // Redirigir al home
            this.router.navigate(['/home']);
          } else {
            console.error('❌ Respuesta inválida:', response);
            this.errorMensaje = 'Error: no se recibió token o usuario.';
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
