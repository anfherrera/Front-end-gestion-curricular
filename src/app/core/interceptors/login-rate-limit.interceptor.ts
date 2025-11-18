import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function saveCooldown(seconds: number) {
  const until = Date.now() + seconds * 1000;
  localStorage.setItem('login_cooldown_until', String(until));
}

export function getLoginCooldownRemainingSeconds(): number {
  const raw = localStorage.getItem('login_cooldown_until');
  if (!raw) return 0;
  const remaining = Math.ceil((Number(raw) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export const loginRateLimitInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 429) {
        const retryAfter = Number(error.headers.get('Retry-After')) || 60;
        saveCooldown(retryAfter);
        return throwError(() => ({
          ...error,
          rateLimited: true,
          retryAfterSeconds: retryAfter,
          message: `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.`
        }));
      }
      return throwError(() => error);
    })
  );
};


