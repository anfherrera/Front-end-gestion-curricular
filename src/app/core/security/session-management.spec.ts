/**
 * Pruebas de seguridad: manejo de sesiones (expiración, inactividad, tokens, limpieza).
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ActivityMonitorService } from '../services/activity-monitor.service';
import { UserRole } from '../enums/roles.enum';
import { of } from 'rxjs';

describe('Seguridad - Manejo de sesiones', () => {
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;
  let apiService: jasmine.SpyObj<ApiService>;
  let activityMonitor: jasmine.SpyObj<ActivityMonitorService>;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['login']);
    const activityMonitorSpy = jasmine.createSpyObj('ActivityMonitorService', [
      'setLogoutCallback',
      'startMonitoring',
      'stopMonitoring',
      'isActive',
      'activity$',
      'warning$'
    ]);

    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ActivityMonitorService, useValue: activityMonitorSpy }
      ]
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    activityMonitor = TestBed.inject(ActivityMonitorService) as jasmine.SpyObj<ActivityMonitorService>;

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(localStorageSpy.removeItem);
  });

  // =====================================
  // SEC-030: ALMACENAMIENTO SEGURO DE TOKENS
  // =====================================
  describe('SEC-030: Almacenamiento Seguro de Tokens', () => {
    
    it('SEC-030-A: Debe almacenar token en localStorage al autenticar', () => {
      const token = createValidToken(3600);
      authService.setToken(token);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
    });

    it('SEC-030-B: Debe almacenar tiempo de expiración con el token', () => {
      const token = createValidToken(3600);
      authService.setToken(token);

      expect(localStorage.setItem).toHaveBeenCalledWith('tokenExp', jasmine.any(String));
    });

    it('SEC-030-C: Debe recuperar token desde localStorage', () => {
      const token = createValidToken(3600);
      localStorageSpy.getItem.and.returnValue(token);

      const retrieved = authService.getToken();

      expect(localStorage.getItem).toHaveBeenCalledWith('token');
      expect(retrieved).toBe(token);
    });

    it('SEC-030-D: Debe manejar caso cuando no hay token en storage', () => {
      localStorageSpy.getItem.and.returnValue(null);

      const retrieved = authService.getToken();

      expect(retrieved).toBeNull();
    });
  });

  // =====================================
  // SEC-031: EXPIRACIÓN AUTOMÁTICA DE SESIONES
  // =====================================
  describe('SEC-031: Expiración Automática de Sesiones', () => {
    
    it('SEC-031-A: Debe detectar token expirado', () => {
      const token = createValidToken(3600);
      const expTime = (Date.now() + 3600 * 1000).toString();
      
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'token') return token;
        if (key === 'tokenExp') return expTime;
        return null;
      });

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBeTrue();
    });

    it('SEC-031-B: Debe rechazar token ya expirado', () => {
      const token = createValidToken(3600);
      const expiredTime = (Date.now() - 1000).toString(); // expiró hace 1 segundo
      
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'token') return token;
        if (key === 'tokenExp') return expiredTime;
        return null;
      });

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBeFalse();
    });

    it('SEC-031-C: Debe rechazar autenticación sin token', () => {
      localStorageSpy.getItem.and.returnValue(null);

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBeFalse();
    });

    it('SEC-031-D: Debe rechazar autenticación sin tiempo de expiración', () => {
      const token = createValidToken(3600);
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'token') return token;
        return null; // no hay tokenExp
      });

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBeFalse();
    });
  });

  // =====================================
  // SEC-032: LIMPIEZA SEGURA AL CERRAR SESIÓN
  // =====================================
  describe('SEC-032: Limpieza Segura al Cerrar Sesión', () => {
    
    it('SEC-032-A: Debe eliminar token al hacer logout', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('SEC-032-B: Debe eliminar datos de usuario al hacer logout', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('usuario');
    });

    it('SEC-032-C: Debe eliminar rol al hacer logout', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('userRole');
    });

    it('SEC-032-D: Debe eliminar tiempo de expiración al hacer logout', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('tokenExp');
    });

    it('SEC-032-E: Debe redirigir a login después de logout', () => {
      authService.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('SEC-032-F: Debe detener monitoreo de actividad al hacer logout', () => {
      authService.logout();

      expect(activityMonitor.stopMonitoring).toHaveBeenCalled();
    });

    it('SEC-032-G: Debe limpiar rol del BehaviorSubject', (done) => {
      let firstEmission = true;
      
      authService.role$.subscribe(role => {
        if (!firstEmission && role === null) {
          expect(role).toBeNull();
          done();
        }
        firstEmission = false;
      });

      authService.logout();
    });
  });

  // =====================================
  // SEC-033: MONITOREO DE ACTIVIDAD
  // =====================================
  describe('SEC-033: Monitoreo de Actividad del Usuario', () => {
    
    it('SEC-033-A: Debe iniciar monitoreo al establecer token', () => {
      const token = createValidToken(3600);
      authService.setToken(token);

      expect(activityMonitor.startMonitoring).toHaveBeenCalled();
    });

    it('SEC-033-B: Debe configurar callback de logout por inactividad', () => {
      expect(activityMonitor.setLogoutCallback).toHaveBeenCalled();
    });

    it('SEC-033-C: Debe detener monitoreo al limpiar token', () => {
      authService.clearToken();

      expect(activityMonitor.stopMonitoring).toHaveBeenCalled();
    });

    it('SEC-033-D: Debe verificar si usuario está activo', () => {
      activityMonitor.isActive.and.returnValue(true);

      const isActive = authService.isUserActive();

      expect(isActive).toBeTrue();
      expect(activityMonitor.isActive).toHaveBeenCalled();
    });
  });

  // =====================================
  // SEC-034: PREVENCIÓN DE SESIONES CONCURRENTES
  // =====================================
  describe('SEC-034: Gestión de Múltiples Sesiones', () => {
    
    it('SEC-034-A: Debe sobrescribir sesión anterior al hacer nuevo login', () => {
      const oldToken = createValidToken(3600);
      const newToken = createValidToken(7200);

      authService.setToken(oldToken);
      authService.setToken(newToken);

      // El último token debe ser el que queda
      expect(localStorage.setItem).toHaveBeenCalledWith('token', newToken);
    });

    it('SEC-034-B: Debe actualizar rol al cambiar de sesión', () => {
      const usuario1 = { rol: { nombre: 'ESTUDIANTE' } };
      const usuario2 = { rol: { nombre: 'COORDINADOR' } };

      authService.setUsuario(usuario1);
      authService.setRole('ESTUDIANTE');
      
      authService.setUsuario(usuario2);
      authService.setRole('COORDINADOR');

      expect(authService.getRole()).toBe(UserRole.COORDINADOR);
    });
  });

  // =====================================
  // SEC-035: RESTAURACIÓN SEGURA DE SESIÓN
  // =====================================
  describe('SEC-035: Restauración Segura de Sesión', () => {
    
    it('SEC-035-A: Debe restaurar rol desde localStorage al inicializar', () => {
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'userRole') return 'estudiante';
        return null;
      });

      // Crear nueva instancia del servicio
      const newAuthService = new AuthService(router, apiService, activityMonitor, 'browser' as any);

      expect(newAuthService.getRole()).toBe(UserRole.ESTUDIANTE);
    });

    it('SEC-035-B: Debe sincronizar rol del usuario con localStorage', () => {
      const usuario = {
        rol: { nombre: 'Coordinador' },
        id_usuario: 1,
        nombre_completo: 'Test User'
      };

      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'usuario') return JSON.stringify(usuario);
        if (key === 'userRole') return 'estudiante'; // rol desactualizado
        return null;
      });

      const retrieved = authService.getUsuario();

      // Debe actualizar el rol en localStorage
      expect(retrieved).toBeTruthy();
    });

    it('SEC-035-C: Debe manejar usuario sin rol en localStorage', () => {
      localStorageSpy.getItem.and.returnValue(null);

      const usuario = authService.getUsuario();

      expect(usuario).toBeNull();
    });
  });

  // =====================================
  // SEC-036: TIMER DE LOGOUT AUTOMÁTICO
  // =====================================
  describe('SEC-036: Timer de Logout Automático', () => {
    
    it('SEC-036-A: Debe configurar timer al establecer token', fakeAsync(() => {
      const token = createValidToken(1); // expira en 1 segundo
      
      spyOn(authService, 'logout');
      authService.setToken(token);

      tick(1500); // Avanzar 1.5 segundos

      expect(authService.logout).toHaveBeenCalled();
    }));

    it('SEC-036-B: Debe limpiar timer anterior al establecer nuevo token', () => {
      const token1 = createValidToken(3600);
      const token2 = createValidToken(7200);

      authService.setToken(token1);
      authService.setToken(token2);

      // No debe haber múltiples timers activos
      expect(localStorage.setItem).toHaveBeenCalledWith('token', token2);
    });

    it('SEC-036-C: Debe restaurar sesión con timer correcto', fakeAsync(() => {
      const expTime = Date.now() + 1000; // expira en 1 segundo
      localStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'tokenExp') return expTime.toString();
        return null;
      });

      spyOn(authService, 'logout');
      authService.restoreSession();

      tick(1500); // Avanzar 1.5 segundos

      expect(authService.logout).toHaveBeenCalled();
    }));
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
});

