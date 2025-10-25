/**
 * ==========================================
 * 🔒 PRUEBAS DE SEGURIDAD - AUTH & ROLE GUARDS
 * ==========================================
 * 
 * Objetivo: Validar control de acceso y autorización por roles
 * 
 * Aspectos evaluados:
 * - Prevención de acceso no autenticado
 * - Validación de roles y permisos
 * - Redirección correcta según autorización
 * - Manejo de tokens expirados
 * - Prevención de escalada de privilegios
 */

import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/roles.enum';

describe('🔒 PRUEBAS DE SEGURIDAD - Guards', () => {
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getRole',
      'getToken'
    ]);

    TestBed.configureTestingModule({
      providers: [
        authGuard,
        RoleGuard,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  // =====================================
  // SEC-010: PREVENCIÓN DE ACCESO NO AUTORIZADO
  // =====================================
  describe('SEC-010: Auth Guard - Prevención de Acceso No Autorizado', () => {
    
    it('SEC-010-A: Debe bloquear acceso sin token de autenticación', () => {
      authService.isAuthenticated.and.returnValue(false);
      
      const guard = TestBed.inject(authGuard);
      const result = guard.canActivate();

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('SEC-010-B: Debe permitir acceso con token válido', () => {
      authService.isAuthenticated.and.returnValue(true);
      
      const guard = TestBed.inject(authGuard);
      const result = guard.canActivate();

      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('SEC-010-C: Debe redirigir a login si token expiró durante navegación', () => {
      authService.isAuthenticated.and.returnValue(false);
      
      const guard = TestBed.inject(authGuard);
      guard.canActivate();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('SEC-010-D: NO debe permitir acceso con token null', () => {
      authService.isAuthenticated.and.returnValue(false);
      authService.getToken.and.returnValue(null);
      
      const guard = TestBed.inject(authGuard);
      const result = guard.canActivate();

      expect(result).toBeFalse();
    });
  });

  // =====================================
  // SEC-011: VALIDACIÓN DE ROLES Y PERMISOS
  // =====================================
  describe('SEC-011: Role Guard - Validación de Roles', () => {
    let roleGuard: RoleGuard;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      roleGuard = TestBed.inject(RoleGuard);
      route = { data: { role: '' } } as any;
      state = { url: '/test' } as RouterStateSnapshot;
    });

    it('SEC-011-A: Debe permitir acceso a ADMIN en ruta de admin', () => {
      authService.getRole.and.returnValue(UserRole.ADMIN);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('SEC-011-B: Debe bloquear acceso de ESTUDIANTE a ruta de admin', () => {
      authService.getRole.and.returnValue(UserRole.ESTUDIANTE);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('SEC-011-C: Debe permitir acceso de COORDINADOR a su ruta', () => {
      authService.getRole.and.returnValue(UserRole.COORDINADOR);
      route.data = { role: 'coordinador' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
    });

    it('SEC-011-D: Debe bloquear acceso de FUNCIONARIO a ruta de coordinador', () => {
      authService.getRole.and.returnValue(UserRole.FUNCIONARIO);
      route.data = { role: 'coordinador' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('SEC-011-E: Debe permitir acceso de SECRETARIA a su ruta', () => {
      authService.getRole.and.returnValue(UserRole.SECRETARIA);
      route.data = { role: 'secretaria' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
    });
  });

  // =====================================
  // SEC-012: PREVENCIÓN DE ESCALADA DE PRIVILEGIOS
  // =====================================
  describe('SEC-012: Prevención de Escalada de Privilegios', () => {
    let roleGuard: RoleGuard;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      roleGuard = TestBed.inject(RoleGuard);
      route = { data: { role: '' } } as any;
      state = { url: '/test' } as RouterStateSnapshot;
    });

    it('SEC-012-A: ESTUDIANTE NO puede acceder a panel de admin', () => {
      authService.getRole.and.returnValue(UserRole.ESTUDIANTE);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('SEC-012-B: FUNCIONARIO NO puede acceder a panel de admin', () => {
      authService.getRole.and.returnValue(UserRole.FUNCIONARIO);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
    });

    it('SEC-012-C: COORDINADOR NO puede acceder a panel de admin', () => {
      authService.getRole.and.returnValue(UserRole.COORDINADOR);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
    });

    it('SEC-012-D: Debe redirigir a login si rol es null', () => {
      authService.getRole.and.returnValue(null);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // =====================================
  // SEC-013: NORMALIZACIÓN DE ROLES
  // =====================================
  describe('SEC-013: Normalización y Sinónimos de Roles', () => {
    let roleGuard: RoleGuard;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      roleGuard = TestBed.inject(RoleGuard);
      route = { data: { role: '' } } as any;
      state = { url: '/test' } as RouterStateSnapshot;
    });

    it('SEC-013-A: Debe reconocer "administrador" como sinónimo de "admin"', () => {
      authService.getRole.and.returnValue(UserRole.ADMIN);
      route.data = { role: 'administrador' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
    });

    it('SEC-013-B: Debe reconocer "secretario" como sinónimo de "secretaria"', () => {
      authService.getRole.and.returnValue(UserRole.SECRETARIA);
      route.data = { role: 'secretario' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
    });

    it('SEC-013-C: Debe normalizar roles en minúsculas', () => {
      authService.getRole.and.returnValue(UserRole.COORDINADOR);
      route.data = { role: 'COORDINADOR' }; // mayúsculas

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
    });

    it('SEC-013-D: Debe eliminar espacios en blanco de roles', () => {
      authService.getRole.and.returnValue(UserRole.FUNCIONARIO);
      route.data = { role: '  funcionario  ' }; // con espacios

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeTrue();
    });
  });

  // =====================================
  // SEC-014: CASOS LÍMITE Y ERRORES
  // =====================================
  describe('SEC-014: Manejo de Casos Límite', () => {
    let roleGuard: RoleGuard;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      roleGuard = TestBed.inject(RoleGuard);
      route = { data: { role: '' } } as any;
      state = { url: '/test' } as RouterStateSnapshot;
    });

    it('SEC-014-A: Debe manejar rol vacío en ruta', () => {
      authService.getRole.and.returnValue(UserRole.ESTUDIANTE);
      route.data = { role: '' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
    });

    it('SEC-014-B: Debe manejar rol inexistente', () => {
      authService.getRole.and.returnValue('INVALID_ROLE' as any);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
    });

    it('SEC-014-C: Debe manejar data sin propiedad role', () => {
      authService.getRole.and.returnValue(UserRole.ESTUDIANTE);
      route.data = {}; // sin role

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
    });

    it('SEC-014-D: Debe bloquear acceso con undefined role', () => {
      authService.getRole.and.returnValue(undefined as any);
      route.data = { role: 'admin' };

      const result = roleGuard.canActivate(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // =====================================
  // SEC-015: MATRIZ DE AUTORIZACIÓN COMPLETA
  // =====================================
  describe('SEC-015: Matriz de Autorización Completa', () => {
    let roleGuard: RoleGuard;
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      roleGuard = TestBed.inject(RoleGuard);
      route = { data: {} } as any;
      state = { url: '/test' } as RouterStateSnapshot;
    });

    const rolesMatrix = [
      { userRole: UserRole.ADMIN, allowedRoutes: ['admin'], deniedRoutes: ['estudiante', 'coordinador', 'funcionario', 'secretaria'] },
      { userRole: UserRole.ESTUDIANTE, allowedRoutes: ['estudiante'], deniedRoutes: ['admin', 'coordinador', 'funcionario', 'secretaria'] },
      { userRole: UserRole.COORDINADOR, allowedRoutes: ['coordinador'], deniedRoutes: ['admin', 'estudiante', 'funcionario', 'secretaria'] },
      { userRole: UserRole.FUNCIONARIO, allowedRoutes: ['funcionario'], deniedRoutes: ['admin', 'estudiante', 'coordinador', 'secretaria'] },
      { userRole: UserRole.SECRETARIA, allowedRoutes: ['secretaria'], deniedRoutes: ['admin', 'estudiante', 'coordinador', 'funcionario'] }
    ];

    rolesMatrix.forEach(({ userRole, allowedRoutes, deniedRoutes }) => {
      describe(`Usuario con rol ${userRole}`, () => {
        
        allowedRoutes.forEach(allowedRoute => {
          it(`SEC-015: Debe PERMITIR acceso a ruta "${allowedRoute}"`, () => {
            authService.getRole.and.returnValue(userRole);
            route.data = { role: allowedRoute };

            const result = roleGuard.canActivate(route, state);

            expect(result).toBeTrue();
            expect(router.navigate).not.toHaveBeenCalled();
          });
        });

        deniedRoutes.forEach(deniedRoute => {
          it(`SEC-015: Debe DENEGAR acceso a ruta "${deniedRoute}"`, () => {
            authService.getRole.and.returnValue(userRole);
            route.data = { role: deniedRoute };

            const result = roleGuard.canActivate(route, state);

            expect(result).toBeFalse();
            expect(router.navigate).toHaveBeenCalledWith(['/home']);
          });
        });
      });
    });
  });
});

