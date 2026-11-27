import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  esErrorLimiteLogin,
  getLoginCooldownRemainingSeconds,
  loginRateLimitInterceptor,
} from './login-rate-limit.interceptor';

describe('loginRateLimitInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const url = 'http://localhost:5000/api/usuarios/login';

  beforeEach(() => {
    localStorage.removeItem('login_cooldown_until');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loginRateLimitInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('login_cooldown_until');
  });

  it('con un 429 guarda la espera de Retry-After y lanza un error de límite', () => {
    let error: unknown;
    http.post(url, {}).subscribe({ error: (e) => (error = e) });
    httpMock
      .expectOne(url)
      .flush(null, { status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '30' } });

    expect(esErrorLimiteLogin(error)).toBeTrue();
    expect(error).toEqual(
      jasmine.objectContaining({
        status: 429,
        rateLimited: true,
        retryAfterSeconds: 30,
        message: 'Demasiados intentos. Intente de nuevo en 30 segundos.',
      })
    );
    const restante = getLoginCooldownRemainingSeconds();
    expect(restante).toBeGreaterThan(28);
    expect(restante).toBeLessThanOrEqual(30);
  });

  it('sin Retry-After espera 60 segundos', () => {
    let error: unknown;
    http.post(url, {}).subscribe({ error: (e) => (error = e) });
    httpMock.expectOne(url).flush(null, { status: 429, statusText: 'Too Many Requests' });

    expect(esErrorLimiteLogin(error) && error.retryAfterSeconds).toBe(60);
    expect(getLoginCooldownRemainingSeconds()).toBeGreaterThan(58);
  });

  it('deja pasar los demás errores sin tocarlos ni guardar espera', () => {
    let error: unknown;
    http.post(url, {}).subscribe({ error: (e) => (error = e) });
    httpMock.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(esErrorLimiteLogin(error)).toBeFalse();
    expect((error as { status: number }).status).toBe(401);
    expect(getLoginCooldownRemainingSeconds()).toBe(0);
  });

  it('la espera restante es 0 si ya pasó o no hay', () => {
    expect(getLoginCooldownRemainingSeconds()).toBe(0);
    localStorage.setItem('login_cooldown_until', String(Date.now() - 5000));
    expect(getLoginCooldownRemainingSeconds()).toBe(0);
  });

  it('esErrorLimiteLogin solo reconoce errores marcados como límite', () => {
    expect(esErrorLimiteLogin(null)).toBeFalse();
    expect(esErrorLimiteLogin('429')).toBeFalse();
    expect(esErrorLimiteLogin({ status: 429 })).toBeFalse();
  });
});
