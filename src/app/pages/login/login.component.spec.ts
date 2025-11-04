import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, delay } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

describe('LoginComponent - Pruebas Unitarias', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let apiService: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' }
  };

  const mockLoginResponse = {
    token: 'mock-jwt-token',
    usuario: mockUsuario
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'setToken',
      'setUsuario',
      'setRole',
      'restoreSession',
      'isAuthenticated'
    ]);
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .overrideProvider(MatSnackBar, { useValue: snackBarSpy })
    .compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  describe('1. Inicialización del Componente', () => {
    it('LOG-001: Debe crear el componente correctamente', () => {
      expect(component).toBeTruthy();
    });

    it('LOG-002: Debe inicializar el formulario con validaciones', () => {
      expect(component.loginForm).toBeTruthy();
      expect(component.loginForm.get('correo')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
      expect(component.loginForm.get('remember')).toBeTruthy();
    });

    it('LOG-003: El formulario debe estar inválido inicialmente', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('LOG-004: La contraseña debe estar oculta por defecto', () => {
      expect(component.hide).toBe(true);
    });

    it('LOG-005: No debe haber mensaje de error inicialmente', () => {
      expect(component.errorMensaje).toBe('');
    });

    it('LOG-006: No debe estar en estado de carga inicialmente', () => {
      expect(component.cargando).toBe(false);
    });
  });

  describe('2. Validación del Campo Correo', () => {
    it('LOG-007: El campo correo debe ser requerido', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('');
      expect(correo?.hasError('required')).toBe(true);
    });

    it('LOG-008: El campo correo debe validar formato de email', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('invalido');
      expect(correo?.hasError('email')).toBe(true);
    });

    it('LOG-009: Debe validar que el correo sea de @unicauca.edu.co', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('test@gmail.com');
      expect(correo?.hasError('unicaucaEmail')).toBe(true);
    });

    it('LOG-010: Debe aceptar correo válido de @unicauca.edu.co', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('test@unicauca.edu.co');
      expect(correo?.valid).toBe(true);
    });

    it('LOG-011: Debe mostrar mensaje de error correcto para correo requerido', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('');
      correo?.markAsTouched();
      
      const mensaje = component.getEmailErrorMessage();
      expect(mensaje).toBe('El correo es requerido');
    });

    it('LOG-012: Debe mostrar mensaje de error correcto para formato inválido', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('invalido');
      correo?.markAsTouched();
      
      const mensaje = component.getEmailErrorMessage();
      expect(mensaje).toBe('Ingresa un correo válido');
    });

    it('LOG-013: Debe mostrar mensaje de error para correo no institucional', () => {
      const correo = component.loginForm.get('correo');
      correo?.setValue('test@gmail.com');
      correo?.markAsTouched();
      
      const mensaje = component.getEmailErrorMessage();
      expect(mensaje).toBe('Debe ser un correo de @unicauca.edu.co');
    });
  });

  describe('3. Validación del Campo Contraseña', () => {
    it('LOG-014: El campo contraseña debe ser requerido', () => {
      const password = component.loginForm.get('password');
      password?.setValue('');
      expect(password?.hasError('required')).toBe(true);
    });

    it('LOG-015: La contraseña debe tener mínimo 8 caracteres', () => {
      const password = component.loginForm.get('password');
      password?.setValue('1234567');
      expect(password?.hasError('minlength')).toBe(true);
    });

    it('LOG-016: Debe aceptar contraseña válida de 8+ caracteres', () => {
      const password = component.loginForm.get('password');
      password?.setValue('password123');
      expect(password?.valid).toBe(true);
    });

    it('LOG-017: Debe mostrar mensaje de error correcto para contraseña requerida', () => {
      const password = component.loginForm.get('password');
      password?.setValue('');
      password?.markAsTouched();
      
      const mensaje = component.getPasswordErrorMessage();
      expect(mensaje).toBe('La contraseña es requerida');
    });

    it('LOG-018: Debe mostrar mensaje de error para contraseña corta', () => {
      const password = component.loginForm.get('password');
      password?.setValue('123');
      password?.markAsTouched();
      
      const mensaje = component.getPasswordErrorMessage();
      expect(mensaje).toBe('La contraseña debe tener al menos 8 caracteres');
    });
  });

  describe('4. Validación del Formulario Completo', () => {
    it('LOG-019: El formulario debe ser válido con datos correctos', () => {
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: 'password123',
        remember: false
      });
      
      expect(component.loginForm.valid).toBe(true);
    });

    it('LOG-020: El formulario debe ser inválido si falta algún campo', () => {
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: ''
      });
      
      expect(component.loginForm.valid).toBe(false);
    });

    it('LOG-021: El campo remember debe ser opcional', () => {
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: 'password123'
      });
      
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('5. Proceso de Login Exitoso', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: 'password123',
        remember: false
      });
    });

    it('LOG-022: Debe llamar al servicio de API con credenciales correctas', () => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      
      expect(apiService.login).toHaveBeenCalledWith('test@unicauca.edu.co', 'password123');
    });

    it('LOG-023: Debe guardar el token en AuthService', fakeAsync(() => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      tick();
      
      expect(authService.setToken).toHaveBeenCalledWith('mock-jwt-token');
    }));

    it('LOG-024: Debe guardar el usuario en AuthService', fakeAsync(() => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      tick();
      
      expect(authService.setUsuario).toHaveBeenCalledWith(mockUsuario);
    }));

    it('LOG-025: Debe guardar el rol del usuario', fakeAsync(() => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      tick();
      
      expect(authService.setRole).toHaveBeenCalledWith('ESTUDIANTE');
    }));

    it('LOG-026: Debe restaurar la sesión', fakeAsync(() => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      tick();
      
      expect(authService.restoreSession).toHaveBeenCalled();
    }));

    it('LOG-027: Debe mostrar mensaje de bienvenida', fakeAsync(() => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      tick(100); // Dar tiempo para que se complete el observable
      fixture.detectChanges();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        '¡Bienvenido, Test User!',
        'Cerrar',
        jasmine.objectContaining({
          duration: 3000
        })
      );
    }));

    it('LOG-028: Debe navegar a /home después del login', fakeAsync(() => {
      apiService.login.and.returnValue(of(mockLoginResponse));
      
      component.onLogin();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('LOG-029: Debe cambiar el estado de cargando durante el proceso', fakeAsync(() => {
      // Usar delay para simular mejor el comportamiento asíncrono
      apiService.login.and.returnValue(of(mockLoginResponse).pipe(delay(50)));
      
      expect(component.cargando).toBe(false);
      
      component.onLogin();
      // Verificar que cargando se establece en true inmediatamente
      expect(component.cargando).toBe(true);
      
      tick(50); // Permitir que el observable se complete
      fixture.detectChanges();
      expect(component.cargando).toBe(false);
    }));
  });

  describe('6. Manejo de Errores en Login', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: 'wrongpassword'
      });
    });

    it('LOG-030: Debe manejar error 401 (credenciales incorrectas)', fakeAsync(() => {
      const error = { status: 401, message: 'Unauthorized' };
      apiService.login.and.returnValue(throwError(() => error));
      
      component.onLogin();
      tick(100); // Dar tiempo para que se maneje el error
      fixture.detectChanges();
      
      expect(component.errorMensaje).toContain('Credenciales incorrectas');
      expect(snackBar.open).toHaveBeenCalled();
    }));

    it('LOG-031: Debe manejar error 403 (cuenta deshabilitada)', fakeAsync(() => {
      const error = { status: 403, message: 'Forbidden' };
      apiService.login.and.returnValue(throwError(() => error));
      
      component.onLogin();
      tick();
      
      expect(component.errorMensaje).toContain('cuenta está deshabilitada');
    }));

    it('LOG-032: Debe manejar error 0 (sin conexión)', fakeAsync(() => {
      const error = { status: 0, message: 'Network error' };
      apiService.login.and.returnValue(throwError(() => error));
      
      component.onLogin();
      tick();
      
      expect(component.errorMensaje).toContain('No se puede conectar al servidor');
    }));

    it('LOG-033: Debe manejar error 500 (error del servidor)', fakeAsync(() => {
      const error = { status: 500, message: 'Internal Server Error' };
      apiService.login.and.returnValue(throwError(() => error));
      
      component.onLogin();
      tick();
      
      expect(component.errorMensaje).toContain('Error interno del servidor');
    }));

    it('LOG-034: Debe desactivar estado de cargando después de error', fakeAsync(() => {
      const error = { status: 401, message: 'Unauthorized' };
      apiService.login.and.returnValue(throwError(() => error));
      
      component.onLogin();
      tick();
      
      expect(component.cargando).toBe(false);
    }));
  });

  describe('7. Validación Antes del Envío', () => {
    it('LOG-035: No debe enviar formulario inválido', () => {
      component.loginForm.patchValue({
        correo: '',
        password: ''
      });
      
      component.onLogin();
      
      expect(apiService.login).not.toHaveBeenCalled();
    });

    it('LOG-036: Debe marcar todos los campos como tocados si formulario inválido', () => {
      component.loginForm.patchValue({
        correo: '',
        password: ''
      });
      
      component.onLogin();
      
      expect(component.loginForm.get('correo')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('LOG-037: Debe mostrar mensaje si formulario es inválido', () => {
      component.loginForm.patchValue({
        correo: '',
        password: ''
      });
      fixture.detectChanges();
      
      component.onLogin();
      fixture.detectChanges();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Por favor, completa todos los campos correctamente',
        'Cerrar',
        jasmine.any(Object)
      );
    });
  });

  describe('8. Funcionalidad de Limpiar Error', () => {
    it('LOG-038: Debe limpiar el mensaje de error', () => {
      component.errorMensaje = 'Error de prueba';
      
      component.clearError();
      
      expect(component.errorMensaje).toBe('');
    });
  });

  describe('9. Redirección si Ya Está Autenticado', () => {
    it('LOG-039: Debe redirigir a /home si ya está autenticado', () => {
      authService.isAuthenticated.and.returnValue(true);
      
      component.ngOnInit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('LOG-040: No debe redirigir si no está autenticado', () => {
      authService.isAuthenticated.and.returnValue(false);
      
      component.ngOnInit();
      
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('10. Respuesta Inválida del Servidor', () => {
    it('LOG-041: Debe manejar respuesta sin token', fakeAsync(() => {
      const invalidResponse = { usuario: mockUsuario };
      apiService.login.and.returnValue(of(invalidResponse));
      
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: 'password123'
      });
      
      component.onLogin();
      tick();
      
      expect(component.errorMensaje).toContain('respuesta del servidor inválida');
    }));

    it('LOG-042: Debe manejar respuesta sin usuario', fakeAsync(() => {
      const invalidResponse = { token: 'mock-token' };
      apiService.login.and.returnValue(of(invalidResponse));
      
      component.loginForm.patchValue({
        correo: 'test@unicauca.edu.co',
        password: 'password123'
      });
      
      component.onLogin();
      tick();
      
      expect(component.errorMensaje).toContain('respuesta del servidor inválida');
    }));
  });
});

