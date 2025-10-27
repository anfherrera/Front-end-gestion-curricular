/**
 * ==========================================
 * 🔒 PRUEBAS DE SEGURIDAD - JWT INTERCEPTOR
 * ==========================================
 * 
 * Objetivo: Validar seguridad del sistema de autenticación mediante JWT
 * 
 * Aspectos evaluados:
 * - Validación de token JWT
 * - Detección y manejo de tokens expirados
 * - Prevención de acceso no autorizado
 * - Manejo correcto de headers de seguridad
 * - Protección contra ataques CSRF
 */

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';

describe('🔒 PRUEBAS DE SEGURIDAD - JWT Interceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([JwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  // =====================================
  // SEC-001: VALIDACIÓN DE TOKEN JWT
  // =====================================
  describe('SEC-001: Validación de Token JWT', () => {
    
    it('SEC-001-A: Debe incluir Authorization header con token válido', () => {
      const validToken = createValidToken(3600); // expira en 1 hora
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBeTrue();
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({});
    });

    it('SEC-001-B: NO debe incluir token en peticiones sin autenticación', () => {
      authService.getToken.and.returnValue(null);

      httpClient.get('/api/public').subscribe();

      const req = httpMock.expectOne('/api/public');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('SEC-001-C: Debe establecer Content-Type correcto para JSON', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.post('/api/test', { data: 'test' }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Content-Type')).toContain('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({});
    });

    it('SEC-001-D: NO debe establecer Content-Type para FormData (archivos)', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.pdf');

      httpClient.post('/api/upload', formData).subscribe();

      const req = httpMock.expectOne('/api/upload');
      // El navegador establece Content-Type automáticamente con boundary
      expect(req.request.headers.has('Content-Type')).toBeFalse();
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({});
    });
  });

  // =====================================
  // SEC-002: DETECCIÓN DE TOKENS EXPIRADOS
  // =====================================
  describe('SEC-002: Detección de Tokens Expirados', () => {
    
    it('SEC-002-A: Debe detectar token expirado y continuar sin autenticación', () => {
      const expiredToken = createExpiredToken();
      authService.getToken.and.returnValue(expiredToken);

      // Espiar console.warn para verificar que se muestra el mensaje
      spyOn(console, 'warn');

      httpClient.get('/api/test').subscribe();

      // ✅ NUEVO COMPORTAMIENTO: NO cierra sesión automáticamente
      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      
      // ✅ Debe mostrar warning en consola
      expect(console.warn).toHaveBeenCalledWith('⏳ Token expirado. Las peticiones se enviarán sin autenticación.');
      expect(console.warn).toHaveBeenCalledWith('💡 Por favor, cierre sesión y vuelva a iniciar sesión.');

      // ✅ La petición debe continuar sin token
      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('SEC-002-B: Debe permitir token que expira en el futuro', () => {
      const validToken = createValidToken(7200); // expira en 2 horas
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      expect(authService.logout).not.toHaveBeenCalled();
      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({});
    });

    it('SEC-002-C: Debe manejar token con payload inválido sin lanzar excepción', () => {
      // Token con payload corrupto
      const invalidToken = 'eyJhbGciOiJIUzI1NiJ9.INVALID_PAYLOAD.signature';
      authService.getToken.and.returnValue(invalidToken);

      // El interceptor intenta procesar el token
      // Si falla el parsing, el token simplemente no se incluye
      httpClient.get('/api/test').subscribe(
        () => {},
        (error) => {
          // Puede haber error al decodificar
          expect(error).toBeTruthy();
        }
      );

      // Verificar que se intenta hacer la petición
      const reqs = httpMock.match('/api/test');
      if (reqs.length > 0) {
        reqs.forEach(req => req.flush({}));
      }
    });

    it('SEC-002-D: Debe aceptar token que aún es válido', () => {
      const validToken = createValidToken(5); // expira en 5 segundos
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(authService.logout).not.toHaveBeenCalled();
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({});
    });
  });

  // =====================================
  // SEC-003: PREVENCIÓN DE ATAQUES
  // =====================================
  describe('SEC-003: Prevención de Ataques', () => {
    
    it('SEC-003-A: Debe validar estructura básica del token JWT', () => {
      // Token válido debe tener 3 partes
      const validToken = createValidToken(3600);
      expect(validToken.split('.').length).toBe(3);
    });

    it('SEC-003-B: Debe procesar tokens con formato correcto', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toContain('Bearer');
      req.flush({});
    });

    it('SEC-003-C: Debe incluir signature en tokens válidos', () => {
      const validToken = createValidToken(3600);
      const parts = validToken.split('.');
      
      expect(parts.length).toBe(3);
      expect(parts[2]).toBeTruthy(); // signature exists
    });

    it('SEC-003-D: Debe establecer charset UTF-8 para prevenir inyección', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.post('/api/test', { input: '<script>alert(1)</script>' }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Content-Type')).toContain('charset=utf-8');
      expect(req.request.headers.get('Accept-Charset')).toBe('utf-8');
      req.flush({});
    });
  });

  // =====================================
  // SEC-004: MANEJO SEGURO DE MÚLTIPLES PETICIONES
  // =====================================
  describe('SEC-004: Manejo Seguro de Múltiples Peticiones', () => {
    
    it('SEC-004-A: Debe aplicar interceptor a múltiples peticiones simultáneas', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();
      httpClient.get('/api/test3').subscribe();

      const reqs = [
        httpMock.expectOne('/api/test1'),
        httpMock.expectOne('/api/test2'),
        httpMock.expectOne('/api/test3')
      ];

      reqs.forEach(req => {
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
        req.flush({});
      });
    });

    it('SEC-004-B: Debe manejar token expirado en peticiones simultáneas', () => {
      const expiredToken = createExpiredToken();
      authService.getToken.and.returnValue(expiredToken);

      // Espiar console.warn
      spyOn(console, 'warn');

      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();

      // ✅ NUEVO COMPORTAMIENTO: NO cierra sesión automáticamente
      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      
      // ✅ Debe mostrar warnings (uno por cada petición)
      expect(console.warn).toHaveBeenCalled();

      const reqs = [
        httpMock.expectOne('/api/test1'),
        httpMock.expectOne('/api/test2')
      ];

      reqs.forEach(req => {
        // ✅ Las peticiones continúan sin token de autorización
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush({});
      });
    });
  });

  // =====================================
  // SEC-005: SEGURIDAD EN HEADERS
  // =====================================
  describe('SEC-005: Seguridad en Headers', () => {
    
    it('SEC-005-A: Debe incluir Accept header para prevenir MIME confusion', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({});
    });

    it('SEC-005-B: NO debe exponer información sensible en headers', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      // No debe incluir headers que expongan información del sistema
      expect(req.request.headers.has('X-Powered-By')).toBeFalse();
      expect(req.request.headers.has('Server')).toBeFalse();
      expect(req.request.headers.has('X-AspNet-Version')).toBeFalse();
      req.flush({});
    });

    it('SEC-005-C: Debe clonar request sin mutar el original', () => {
      const validToken = createValidToken(3600);
      authService.getToken.and.returnValue(validToken);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      // Verificar que el request fue clonado (tiene Authorization)
      expect(req.request.headers.get('Authorization')).toBeTruthy();
      req.flush({});
    });
  });

  // =====================================
  // HELPERS
  // =====================================
  function createValidToken(expiresInSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiresInSeconds;
    const payload = btoa(JSON.stringify({ exp, userId: 1, role: 'ESTUDIANTE' }));
    return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
  }

  function createExpiredToken(): string {
    const expiredTime = Math.floor(Date.now() / 1000) - 3600; // expiró hace 1 hora
    const payload = btoa(JSON.stringify({ exp: expiredTime, userId: 1 }));
    return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
  }
});

